import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { dueList } from './reviews.ts'

const now = new Date('2026-11-12T02:00:00.000Z')
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
})
