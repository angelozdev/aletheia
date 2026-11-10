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

function freshCards(count: number): Card[] {
  return Array.from({ length: count }, (_, index) => {
    const created = new Date(Date.UTC(2026, 10, 1, 10, index))
    return newCard(SAMPLE_DRAFT, `new-${index}`, created)
  })
}

function graded(cardId: string, reviewedAt: string, stateBefore: Card['state'] = 'review'): Review {
  return {
    cardId,
    grade: 'good',
    claudeGrade: 'good',
    stateBefore,
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

  it('sessionList keeps the first saved new cards within the budget and counts the rest as held back', () => {
    const fresh = freshCards(15)
    const firstSaved = fresh.slice(0, 10)

    const list = listOf({ scope: fresh.toReversed() })

    expect(ids(list.cards)).toEqual(ids(firstSaved))
    expect(list).toMatchObject({ remaining: 0, heldBack: 5 })
  })

  it('sessionList counts as introduced today the reviews since the start of today whose state before was new', () => {
    const reviews = [
      ...['a', 'b', 'c', 'd'].map((id) => graded(id, '2026-11-11T15:00:00.000Z', 'new')),
      graded('yesterday', '2026-11-11T04:59:59.999Z', 'new'),
      graded('studied', '2026-11-11T15:00:00.000Z', 'review'),
    ]

    const list = listOf({ scope: freshCards(15), reviews })

    expect(list.cards).toHaveLength(6)
    expect(list.heldBack).toBe(9)
  })

  it('sessionList brings back a learning card within 20 minutes when only held-back new cards are left', () => {
    const step = studied('step', 'learning', '2026-11-12T02:10:00.000Z')
    const limits = { ...BUILT_IN_SETTINGS, newPerDay: 0 }

    const list = listOf({ scope: [...freshCards(3), step], limits })

    expect(ids(list.cards)).toEqual(['step'])
    expect(list.heldBack).toBe(3)
  })

  it('sessionList names the start of tomorrow as nextDue when new cards are held back and nothing comes sooner', () => {
    const later = studied('later', 'review', '2026-11-14T15:00:00.000Z')
    const limits = { ...BUILT_IN_SETTINGS, newPerDay: 0 }

    const list = listOf({ scope: [...freshCards(3), later], limits })

    expect(list).toMatchObject({ cards: [], heldBack: 3, nextDue: tomorrow })
  })

  describe('share of new cards', () => {
    function newPlaces(list: SessionList): number[] {
      return list.cards.flatMap((card, index) => (card.state === 'new' ? [index + 1] : []))
    }

    it('003-US3-AS5 with 100 reviews due and 50 new, a session of 20 holds 18 reviews and 2 new, the 10th and the 20th', () => {
      const reviews = dueReviews(100)
      const fresh = freshCards(50)
      const expected = [...reviews.slice(0, 9), fresh[0], ...reviews.slice(9, 18), fresh[1]]

      const list = listOf({ scope: [...reviews, ...fresh] })

      expect(ids(list.cards)).toEqual(ids(expected))
      expect(list).toMatchObject({ remaining: 90, heldBack: 40 })
    })

    it('sessionList places the i-th of k share places at ceil(i × size / k)', () => {
      const limits = { ...BUILT_IN_SETTINGS, newShare: 20 }
      const scope = [...dueReviews(30), ...freshCards(10)]

      const list = listOf({ scope, limits })

      expect(newPlaces(list)).toEqual([5, 10, 15, 20])
    })

    it('sessionList keeps share places already passed in the session', () => {
      const reviews = Array.from({ length: 10 }, (_, index) =>
        graded(`done-${index}`, '2026-11-12T01:30:00.000Z'),
      )
      const scope = [...dueReviews(30), ...freshCards(5)]

      const list = listOf({ scope, reviews })

      expect(list.cards).toHaveLength(10)
      expect(newPlaces(list)).toEqual([10])
    })

    it('sessionList gives the daily limit the last word', () => {
      const limits = { ...BUILT_IN_SETTINGS, sessionSize: 200 }
      const scope = [...dueReviews(300), ...freshCards(50)]

      const list = listOf({ scope, limits })

      expect(list.cards).toHaveLength(200)
      expect(newPlaces(list)).toHaveLength(10)
    })
  })
})
