import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { dueList, topicList } from './reviews.ts'

const now = new Date('2026-11-12T02:00:00.000Z')
const today = new Date('2026-11-11T05:00:00.000Z')
const tomorrow = new Date('2026-11-12T05:00:00.000Z')

function newCardAt(id: string, created: string): Card {
  return newCard(SAMPLE_DRAFT, id, new Date(created))
}

function studied(id: string, state: Card['state'], due: string): Card {
  return { ...newCardAt(id, '2026-11-01T10:00:00.000Z'), state, due: new Date(due) }
}

function dueIds(cards: Card[]): string[] {
  return dueList(cards, now, tomorrow).cards.map(({ id }) => id)
}

describe('due list', () => {
  it('dueList puts learning cards whose instant passed first, then review cards due before tomorrow, then new cards', () => {
    const cards = [
      newCardAt('new-late', '2026-11-10T10:00:00.000Z'),
      studied('review-today', 'review', '2026-11-12T04:59:59.000Z'),
      studied('learning-in-a-minute', 'learning', '2026-11-12T02:01:00.000Z'),
      newCardAt('new-same-b', '2026-11-09T12:00:00.000Z'),
      studied('learning-passed', 'learning', '2026-11-12T01:50:00.000Z'),
      studied('review-tomorrow', 'review', '2026-11-12T05:00:00.000Z'),
      newCardAt('new-same-a', '2026-11-09T12:00:00.000Z'),
      studied('relearning-passed', 'relearning', '2026-11-12T01:40:00.000Z'),
      studied('review-yesterday', 'review', '2026-11-11T15:00:00.000Z'),
      newCardAt('new-early', '2026-11-09T10:00:00.000Z'),
    ]

    expect(dueIds(cards)).toEqual([
      'relearning-passed',
      'learning-passed',
      'review-yesterday',
      'review-today',
      'new-early',
      'new-same-a',
      'new-same-b',
      'new-late',
    ])
  })

  it('dueList names the earliest instant among the cards left out', () => {
    const cards = [
      studied('review-later', 'review', '2026-11-13T15:00:00.000Z'),
      studied('review-tomorrow', 'review', '2026-11-12T05:00:00.000Z'),
    ]

    expect(dueList(cards, now, tomorrow)).toEqual({
      cards: [],
      nextDue: new Date('2026-11-12T05:00:00.000Z'),
    })
  })

  it('dueList names none on an empty deck', () => {
    expect(dueList([], now, tomorrow)).toEqual({ cards: [], nextDue: null })
  })

  describe.for(['learning', 'relearning'] as const)('a %s card', (state) => {
    it('due within 20 minutes joins the list when nothing else is due', () => {
      const cards = [studied('step', state, '2026-11-12T02:20:00.000Z')]

      expect(dueIds(cards)).toEqual(['step'])
    })

    it('due within 20 minutes stays out while another card is due', () => {
      const cards = [
        studied('step', state, '2026-11-12T02:10:00.000Z'),
        newCardAt('fresh', '2026-11-10T10:00:00.000Z'),
      ]

      expect(dueIds(cards)).toEqual(['fresh'])
    })

    it('stays out when its step ends in 21 minutes', () => {
      const cards = [studied('step', state, '2026-11-12T02:21:00.000Z')]

      expect(dueIds(cards)).toEqual([])
    })
  })
})

describe('topic list', () => {
  function topicIds(cards: Card[]): string[] {
    return topicList(cards, now, today, tomorrow).cards.map(({ id }) => id)
  }

  function gradedAt(card: Card, lastReview: string): Card {
    return { ...card, lastReview: new Date(lastReview) }
  }

  it('topicList puts the due list first, then review cards not due, soonest first', () => {
    const cards = [
      studied('review-in-30-days', 'review', '2026-12-11T15:00:00.000Z'),
      newCardAt('fresh', '2026-11-10T10:00:00.000Z'),
      studied('review-in-3-days', 'review', '2026-11-14T15:00:00.000Z'),
      studied('review-today', 'review', '2026-11-11T20:00:00.000Z'),
    ]

    expect(topicIds(cards)).toEqual([
      'review-today',
      'fresh',
      'review-in-3-days',
      'review-in-30-days',
    ])
  })

  it('topicList leaves out a review card not due whose last review is today', () => {
    const gradedToday = studied('graded-today', 'review', '2026-11-14T15:00:00.000Z')
    const gradedYesterday = studied('graded-yesterday', 'review', '2026-11-14T16:00:00.000Z')
    const cards = [
      gradedAt(gradedToday, '2026-11-11T05:00:00.000Z'),
      gradedAt(gradedYesterday, '2026-11-11T04:59:59.000Z'),
    ]

    expect(topicList(cards, now, today, tomorrow)).toMatchObject({
      cards: [{ id: 'graded-yesterday' }],
      nextDue: new Date('2026-11-14T15:00:00.000Z'),
    })
  })
})
