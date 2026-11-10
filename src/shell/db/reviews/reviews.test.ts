import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { newCard } from '#core/cards'
import type { Review } from '#core/reviews'
import { scheduleAfter, type Grade } from '#core/scheduling'
import { SAMPLE_DRAFT } from '../../../../tests/support/cards/cards.constants.ts'
import {
  insertSql,
  openTestStore,
  runSql,
  selectAll,
} from '../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'
import { StoreCardRepository } from '../cards/cards.ts'
import { closeStore } from '../database/database.ts'
import type { Store } from '../database/database.types.ts'
import { StoreReviewRepository } from './reviews.ts'

const NOW = '2026-11-09T15:00:00.000Z'
const now = new Date(NOW)
const card = newCard(SAMPLE_DRAFT, 'k7m2', now)

const REVIEW: Review = {
  cardId: 'k7m2',
  grade: 'good',
  claudeGrade: 'good',
  stateBefore: 'new',
  reviewedAt: now,
  answer: 'ps muestra los que corren, -a todos',
  rationale: 'Cubre los dos key points, sin dudar.',
}

const VALID_REVIEW: Record<string, string> = {
  card_id: 'k7m2',
  grade: 'good',
  claude_grade: 'good',
  state_before: 'new',
  reviewed_at: NOW,
  answer: 'a',
  rationale: 'r',
}

const SCHEDULE = 'select state, due, reps, last_review from cards'

let path: string

async function withStore(action: (store: Store) => void): Promise<void> {
  const store = await openTestStore(path)
  try {
    action(store)
  } finally {
    closeStore(store)
  }
}

function insertReview(overrides: Record<string, string> = {}): string {
  return insertSql('reviews', { ...VALID_REVIEW, ...overrides })
}

beforeEach(async () => {
  path = join(tempDir('aletheia-store-'), 'store.sqlite')
  await withStore((store) => new StoreCardRepository(store).saveAll([card]))
})

describe('StoreReviewRepository', () => {
  it("record stores the review and the card's new schedule together", async () => {
    const graded = scheduleAfter(card, 'good', now)

    await withStore((store) => new StoreReviewRepository(store).record(REVIEW, graded))

    expect(
      selectAll(
        path,
        'select card_id, grade, claude_grade, state_before, reviewed_at, answer, rationale from reviews',
      ),
    ).toEqual([
      {
        card_id: 'k7m2',
        grade: 'good',
        claude_grade: 'good',
        state_before: 'new',
        reviewed_at: NOW,
        answer: REVIEW.answer,
        rationale: REVIEW.rationale,
      },
    ])
    expect(selectAll(path, SCHEDULE)).toEqual([
      { state: 'review', due: '2026-11-11T15:00:00.000Z', reps: 1, last_review: NOW },
    ])
  })

  it('since returns the reviews at or after the instant', async () => {
    const at = (offset: number) => new Date(now.getTime() + offset)
    let since: Review[] = []

    await withStore((store) => {
      const reviews = new StoreReviewRepository(store)
      for (const offset of [-1, 0, 1])
        reviews.record({ ...REVIEW, reviewedAt: at(offset) }, scheduleAfter(card, 'good', now))
      since = reviews.since(now)
    })

    expect(since).toEqual([
      { ...REVIEW, reviewedAt: at(0) },
      { ...REVIEW, reviewedAt: at(1) },
    ])
  })

  it('record changes nothing when the store refuses the review', async () => {
    const before = selectAll(path, SCHEDULE)
    const refused = { ...REVIEW, grade: 'perfect' as Grade }

    await withStore((store) => {
      const reviews = new StoreReviewRepository(store)
      expect(() => reviews.record(refused, scheduleAfter(card, 'good', now))).toThrow()
    })

    expect(selectAll(path, 'select count(*) as n from reviews')).toEqual([{ n: 0 }])
    expect(selectAll(path, SCHEDULE)).toEqual(before)
  })

  it('INV-02 the store refuses to delete a review', () => {
    runSql(path, insertReview())

    expect(() => runSql(path, 'delete from reviews')).toThrow('reviews are never deleted')
    expect(selectAll(path, 'select count(*) as n from reviews')).toEqual([{ n: 1 }])
  })

  it('INV-02 the store refuses to change a review', () => {
    runSql(path, insertReview())

    expect(() => runSql(path, "update reviews set grade = 'again'")).toThrow(
      'reviews are never changed',
    )
    expect(selectAll(path, 'select grade from reviews')).toEqual([{ grade: 'good' }])
  })
})

describe('the reviews table', () => {
  it('accepts a valid review', () => {
    runSql(path, insertReview())

    expect(selectAll(path, 'select count(*) as n from reviews')).toEqual([{ n: 1 }])
  })

  it.for<[string, Record<string, string>]>([
    ['a grade outside the four', { grade: 'perfect' }],
    ['a claude grade outside the four', { claude_grade: 'perfect' }],
    ['a state before outside the four', { state_before: 'done' }],
    ['a blank answer', { answer: '  ' }],
    ['a blank rationale', { rationale: '  ' }],
    ['a review for a card that does not exist', { card_id: 'zzzz' }],
  ])('refuses %s', ([, overrides]) => {
    expect(() => runSql(path, insertReview(overrides))).toThrow()
    expect(selectAll(path, 'select count(*) as n from reviews')).toEqual([{ n: 0 }])
  })
})
