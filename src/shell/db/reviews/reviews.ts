import { asc, eq, gte } from 'drizzle-orm'
import type { Card } from '#core/cards'
import type { Review, ReviewRepository } from '#core/reviews'
import { instantFrom, storedInstant } from '#core/time'
import { cards } from '../cards/cards.schema.ts'
import { scheduleRow } from '../cards/cards.ts'
import { database } from '../database/database.ts'
import type { Database, Store } from '../database/database.types.ts'
import { reviews } from './reviews.schema.ts'
import type { ReviewRow, StoredReview } from './reviews.types.ts'

function reviewRow(review: Review): ReviewRow {
  return { ...review, reviewedAt: storedInstant(review.reviewedAt) }
}

function reviewFrom({ id: _id, ...row }: StoredReview): Review {
  return { ...row, reviewedAt: instantFrom(row.reviewedAt) }
}

export class StoreReviewRepository implements ReviewRepository {
  readonly #db: Database

  constructor(store: Store) {
    this.#db = database(store)
  }

  record(review: Review, card: Card): void {
    this.#db.transaction((tx) => {
      tx.insert(reviews).values(reviewRow(review)).run()
      tx.update(cards).set(scheduleRow(card)).where(eq(cards.id, card.id)).run()
    })
  }

  since(instant: Date): Review[] {
    const from = storedInstant(instant)
    return this.#db
      .select()
      .from(reviews)
      .where(gte(reviews.reviewedAt, from))
      .orderBy(asc(reviews.id))
      .all()
      .map(reviewFrom)
  }
}
