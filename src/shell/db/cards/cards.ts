import type { Card, CardRepository } from '#core/cards'
import { eq, sql } from 'drizzle-orm'
import { instantFrom, storedInstant } from '#core/time'
import { database } from '../database/database.ts'
import type { Store } from '../database/database.types.ts'
import { cards, cardTags } from './cards.schema.ts'
import type { CardRow, StoredCard } from './cards.types.ts'

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
    due: storedInstant(card.due),
    state: card.state,
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduledDays,
    learningSteps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    lastReview: card.lastReview === null ? null : storedInstant(card.lastReview),
    createdAt: storedInstant(card.createdAt),
    updatedAt: storedInstant(card.updatedAt),
  }
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

export function cardRepository(store: Store): CardRepository {
  const db = database(store)
  return {
    saveAll(saved) {
      db.transaction((tx) => {
        for (const card of saved) {
          tx.insert(cards).values(cardRow(card)).run()
          tx.insert(cardTags)
            .values(card.tags.map((tag) => ({ cardId: card.id, tag })))
            .run()
        }
      })
    },
    find(id) {
      const row = db.select().from(cards).where(eq(cards.id, id)).get()
      if (row === undefined) return null
      const tags = db
        .select({ tag: cardTags.tag })
        .from(cardTags)
        .where(eq(cardTags.cardId, id))
        .orderBy(sql`rowid`)
        .all()
      return cardFrom(
        row,
        tags.map(({ tag }) => tag),
      )
    },
  }
}
