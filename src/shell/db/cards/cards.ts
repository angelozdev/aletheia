import { ACTIVE_STATUS, CardIdTakenError, type Card, type CardRepository } from '#core/cards'
import { DrizzleQueryError, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { instantFrom, storedInstant } from '#core/time'
import { database } from '../database/database.ts'
import type { Database, Store } from '../database/database.types.ts'
import { TAKEN_ID, TERM_SEPARATOR } from './cards.constants.ts'
import { cards, cardTags } from './cards.schema.ts'
import type { CardRow, ScheduleRow, StoredCard } from './cards.types.ts'

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

function cardRow(card: Card): CardRow {
  return {
    id: card.id,
    type: card.type,
    question: card.question,
    answer: card.answer,
    situation: card.situation,
    source: card.source,
    keyPoints: JSON.stringify(card.keyPoints),
    status: card.status,
    ...scheduleRow(card),
    createdAt: storedInstant(card.createdAt),
    updatedAt: storedInstant(card.updatedAt),
  }
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
        tx.insert(cardTags)
          .values(card.tags.map((tag) => ({ cardId: card.id, tag })))
          .run()
      }
    })
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
