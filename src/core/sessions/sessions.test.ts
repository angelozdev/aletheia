import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import type { Review } from '#core/reviews'
import { BUILT_IN_SETTINGS } from '#core/settings'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { sessionList } from './sessions.ts'
import type { SessionInput, SessionList } from './sessions.types.ts'

const now = new Date('2026-11-12T02:00:00.000Z')
const today = new Date('2026-11-11T05:00:00.000Z')
const tomorrow = new Date('2026-11-12T05:00:00.000Z')
const start = new Date('2026-11-12T01:00:00.000Z')
const DUE_TODAY = '2026-11-11T20:00:00.000Z'

function studied(id: string, state: Card['state'], due: string): Card {
  const card = newCard(SAMPLE_DRAFT, id, new Date('2026-11-01T10:00:00.000Z'))
  return { ...card, state, due: new Date(due) }
}

function dueReviews(count: number, prefix = 'due'): Card[] {
  return Array.from({ length: count }, (_, index) =>
    studied(`${prefix}-${index}`, 'review', DUE_TODAY),
  )
}

function graded(cardId: string, reviewedAt: string): Review {
  return {
    cardId,
    grade: 'good',
    claudeGrade: 'good',
    stateBefore: 'review',
    reviewedAt: new Date(reviewedAt),
    answer: 'a',
    rationale: 'r',
  }
}

function listOf(input: Partial<SessionInput>): SessionList {
  return sessionList({
    scope: [],
    topic: false,
    reviews: [],
    now,
    today,
    tomorrow,
    start,
    limits: BUILT_IN_SETTINGS,
    ...input,
  })
}

function ids(cards: Card[]): string[] {
  return cards.map(({ id }) => id)
}

describe('session list', () => {
  it('sessionList holds at most the session size and counts the rest as remaining', () => {
    const scope = dueReviews(25)
    const first20 = scope.slice(0, 20)

    const list = listOf({ scope })

    expect(ids(list.cards)).toEqual(ids(first20))
    expect(list).toMatchObject({ remaining: 5, heldBack: 0, capReached: false })
  })

  it('sessionList counts the distinct cards graded since the session start', () => {
    const reviews = [
      graded('before-start', '2026-11-12T00:59:59.999Z'),
      graded('done-a', '2026-11-12T01:00:00.000Z'),
      graded('done-a', '2026-11-12T01:30:00.000Z'),
      graded('done-b', '2026-11-12T01:40:00.000Z'),
    ]

    const list = listOf({ scope: dueReviews(25), reviews })

    expect(list.cards).toHaveLength(18)
    expect(list.remaining).toBe(7)
  })

  it('sessionList puts a card graded in the session and due again first, taking no place', () => {
    const again = studied('again', 'relearning', '2026-11-12T01:50:00.000Z')
    const scope = [...dueReviews(5), again]
    const reviews = [graded('again', '2026-11-12T01:40:00.000Z')]
    const limits = { ...BUILT_IN_SETTINGS, sessionSize: 3 }

    const list = listOf({ scope, reviews, limits })

    expect(ids(list.cards)).toEqual(['again', 'due-0', 'due-1'])
    expect(list).toMatchObject({ remaining: 3, capReached: false })
  })

  it('sessionList says the cap is reached when the session has graded its size', () => {
    const reviews = ['a', 'b', 'c'].map((id) => graded(id, '2026-11-12T01:40:00.000Z'))
    const limits = { ...BUILT_IN_SETTINGS, sessionSize: 3 }

    const list = listOf({ scope: dueReviews(5), reviews, limits })

    expect(list).toMatchObject({ cards: [], remaining: 5, capReached: true })
  })

  it('sessionList names as nextDue the earliest due among cards neither listed nor remaining', () => {
    const scope = [
      ...dueReviews(22),
      studied('in-3-days', 'review', '2026-11-14T15:00:00.000Z'),
      studied('in-2-days', 'review', '2026-11-13T15:00:00.000Z'),
    ]

    expect(listOf({ scope }).nextDue).toEqual(new Date('2026-11-13T15:00:00.000Z'))
  })
})
