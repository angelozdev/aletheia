import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import { instantFrom, storedInstant } from '#core/time'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { scheduleAfter } from './scheduling.ts'
import type { Grade } from './scheduling.types.ts'

const now = new Date('2026-11-09T15:00:00.000Z')
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

const fresh = newCard(SAMPLE_DRAFT, 'k7m2', now)

function after(start: Date, milliseconds: number): Date {
  return new Date(start.getTime() + milliseconds)
}

function dueOf(card: Card, grade: Grade, at: Date): Date {
  return scheduleAfter(card, grade, at).due
}

function asStored(card: Card): Card {
  const lastReview = card.lastReview === null ? null : storedInstant(card.lastReview)
  return {
    ...card,
    due: instantFrom(storedInstant(card.due)),
    lastReview: lastReview === null ? null : instantFrom(lastReview),
    createdAt: instantFrom(storedInstant(card.createdAt)),
    updatedAt: instantFrom(storedInstant(card.updatedAt)),
  }
}

describe('scheduling', () => {
  it('001-US2-AS8 a new card graded Good is due on a later day', () => {
    const graded = scheduleAfter(fresh, 'good', now)

    expect(graded).toMatchObject({
      state: 'review',
      due: after(now, 2 * DAY),
      reps: 1,
      lastReview: now,
    })
  })

  it('001-US2-AS8 a new card graded Again or Hard comes back within 20 minutes', () => {
    expect(scheduleAfter(fresh, 'again', now)).toMatchObject({
      state: 'learning',
      due: after(now, 10 * MINUTE),
    })
    expect(scheduleAfter(fresh, 'hard', now)).toMatchObject({
      state: 'learning',
      due: after(now, 15 * MINUTE),
    })
  })

  it('001-US2-AS8 a Good after that step moves the card to a later day', () => {
    const stepped = scheduleAfter(fresh, 'again', now)

    const graded = scheduleAfter(stepped, 'good', stepped.due)

    expect(graded).toMatchObject({ state: 'review', due: after(stepped.due, DAY) })
  })

  it('001-US2-AS3 four copies of a new card graded differently come back Again first and Easy last', () => {
    const dues = (['again', 'hard', 'good', 'easy'] as const).map((grade) =>
      dueOf(fresh, grade, now),
    )

    expect(dues).toEqual([
      after(now, 10 * MINUTE),
      after(now, 15 * MINUTE),
      after(now, 2 * DAY),
      after(now, 8 * DAY),
    ])
  })

  it('001-US2-AS3 four copies of a review card graded differently come back Again first and Easy last', () => {
    const learned = scheduleAfter(fresh, 'good', now)
    const at = learned.due

    const [again, hard, good, easy] = (['again', 'hard', 'good', 'easy'] as const).map((grade) =>
      scheduleAfter(learned, grade, at),
    )

    expect(again).toMatchObject({ state: 'relearning', due: after(at, 10 * MINUTE) })
    expect(again.due < hard.due && hard.due < good.due && good.due < easy.due).toBe(true)
  })

  it('a card read back from the store schedules like the original', () => {
    const learned = scheduleAfter(fresh, 'good', now)

    const original = scheduleAfter(learned, 'hard', learned.due)
    const readBack = scheduleAfter(asStored(learned), 'hard', learned.due)

    expect(readBack).toEqual(original)
  })
})
