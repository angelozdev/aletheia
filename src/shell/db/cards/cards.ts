import {
  ACTIVE_STATUS,
  ARCHIVED_STATUS,
  CardIdTakenError,
  type Card,
  type CardArchive,
  type CardRepository,
  type CardStatus,
} from '#core/cards'
import { desc, DrizzleQueryError, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { instantFrom, storedInstant } from '#core/time'
import { database } from '../database/database.ts'
import type { Database, Store } from '../database/database.types.ts'
import { TAKEN_ID, TERM_SEPARATOR } from './cards.constants.ts'
import { cards, cardStatusHistory, cardTags } from './cards.schema.ts'
import type { CardRow, ContentRow, ScheduleRow, StoredCard, TagRow } from './cards.types.ts'

export function scheduleRow(card: Card): ScheduleRow {
  return {
    due: storedInstant(card.due),
    state: card.state,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduledDays,
    learningSteps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    lastReview: card.lastReview === null ? null : storedInstant(card.lastReview),
  }
}

function contentRow(card: Card): ContentRow {
  return {
    type: card.type,
    question: card.question,
    answer: card.answer,
    situation: card.situation,
    keyPoints: JSON.stringify(card.keyPoints),
    updatedAt: storedInstant(card.updatedAt),
  }
}

function cardRow(card: Card): CardRow {
  return {
    id: card.id,
    source: card.source,
    status: card.status,
    ...contentRow(card),
    ...scheduleRow(card),
    createdAt: storedInstant(card.createdAt),
  }
}

function tagRows(card: Card): TagRow[] {
  return card.tags.map((tag) => ({ cardId: card.id, tag }))
}

function isTakenId(error: unknown): boolean {
  return error instanceof DrizzleQueryError && error.cause?.message === TAKEN_ID
}

function searchQuery(terms: string[]): string {
  return terms.map((term) => `"${term}"*`).join(TERM_SEPARATOR)
}

function cardFrom(row: StoredCard, tags: string[]): Card {
  return {
    ...row,
    tags,
    keyPoints: JSON.parse(row.keyPoints),
    due: instantFrom(row.due),
    lastReview: row.lastReview === null ? null : instantFrom(row.lastReview),
    createdAt: instantFrom(row.createdAt),
    updatedAt: instantFrom(row.updatedAt),
  }
}

export class StoreCardRepository implements CardRepository {
  readonly #db: Database

  constructor(store: Store) {
    this.#db = database(store)
  }

  saveAll(saved: Card[]): void {
    try {
      this.#insertAll(saved)
    } catch (error) {
      if (isTakenId(error)) throw new CardIdTakenError()
      throw error
    }
  }

  #insertAll(saved: Card[]): void {
    this.#db.transaction((tx) => {
      for (const card of saved) {
        tx.insert(cards).values(cardRow(card)).run()
        tx.insert(cardTags).values(tagRows(card)).run()
      }
    })
  }

  update(card: Card): void {
    this.#db.transaction((tx) => {
      tx.update(cards).set(contentRow(card)).where(eq(cards.id, card.id)).run()
      tx.delete(cardTags).where(eq(cardTags.cardId, card.id)).run()
      tx.insert(cardTags).values(tagRows(card)).run()
    })
  }

  archive(id: string, reason: string, at: Date): void {
    this.#changeStatus(id, ARCHIVED_STATUS, reason, at)
  }

  #changeStatus(id: string, status: CardStatus, reason: string | null, at: Date): void {
    this.#db.transaction((tx) => {
      tx.update(cards).set({ status }).where(eq(cards.id, id)).run()
      tx.insert(cardStatusHistory)
        .values({ cardId: id, status, reason, changedAt: storedInstant(at) })
        .run()
    })
  }

  archiveOf(id: string): CardArchive | null {
    const latest = this.#db
      .select()
      .from(cardStatusHistory)
      .where(eq(cardStatusHistory.cardId, id))
      .orderBy(desc(cardStatusHistory.id))
      .get()
    if (latest?.status !== ARCHIVED_STATUS || latest.reason === null) return null
    return { reason: latest.reason, at: instantFrom(latest.changedAt) }
  }

  find(id: string): Card | null {
    const row = this.#db.select().from(cards).where(eq(cards.id, id)).get()
    if (row === undefined) return null
    return cardFrom(row, this.#tagsOf(id))
  }

  active(): Card[] {
    return this.#cardsWhere(eq(cards.status, ACTIVE_STATUS))
  }

  matching(terms: string[]): Card[] {
    if (terms.length === 0) return []
    const ids = this.#matchingIds(searchQuery(terms))
    const found = this.#cardsWhere(inArray(cards.id, ids))
    const byId = new Map(found.map((card) => [card.id, card]))
    return ids.map((id) => byId.get(id)).filter((card) => card !== undefined)
  }

  #matchingIds(query: string): string[] {
    return this.#db
      .all<{ id: string }>(
        sql`select c.id from card_search s join cards c on c.id = s.card_id where card_search match ${query} and c.status = ${ACTIVE_STATUS} order by s.rank`,
      )
      .map(({ id }) => id)
  }

  #cardsWhere(condition: SQL): Card[] {
    const rows = this.#db.select().from(cards).where(condition).all()
    const tags = this.#tagsByCard()
    return rows.map((row) => cardFrom(row, tags.get(row.id) ?? []))
  }

  #tagsByCard(): Map<string, string[]> {
    const rows = this.#db
      .select()
      .from(cardTags)
      .orderBy(sql`rowid`)
      .all()
    const byCard = new Map<string, string[]>()
    for (const { cardId, tag } of rows) byCard.set(cardId, [...(byCard.get(cardId) ?? []), tag])
    return byCard
  }

  #tagsOf(id: string): string[] {
    return this.#db
      .select({ tag: cardTags.tag })
      .from(cardTags)
      .where(eq(cardTags.cardId, id))
      .orderBy(sql`rowid`)
      .all()
      .map(({ tag }) => tag)
  }
}
