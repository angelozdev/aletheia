import { describe, expect, it } from 'vitest'
import { newCard, type Card, type CardState } from '#core/cards'
import type { Review } from '#core/reviews'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { reviewOf } from '../../../tests/support/reviews/reviews.ts'
import { tagProgress } from './progress.ts'
import type { ProgressTree } from './progress.types.ts'

const today = new Date('2026-11-15T05:00:00.000Z')
const tomorrow = new Date('2026-11-16T05:00:00.000Z')
const windowStart = new Date('2026-10-17T05:00:00.000Z')
const DUE_TODAY = '2026-11-15T23:00:00.000Z'

function cardOf(id: string, tags: string[], state: CardState = 'review', due = DUE_TODAY): Card {
  const card = newCard({ ...SAMPLE_DRAFT, tags }, id, new Date('2026-10-01T10:00:00.000Z'))
  return { ...card, state, due: new Date(due) }
}

function progressOf(cards: Card[], reviews: Review[] = []): ProgressTree {
  return tagProgress({ cards, reviews, today, tomorrow, windowStart })
}

describe('tag progress', () => {
  it('tagProgress counts a card once in its parent, once in each child and once in the deck', () => {
    const card = cardOf('aaaa', ['messaging::rabbitmq', 'messaging::redis-streams'])

    expect(progressOf([card])).toMatchObject({
      deck: { cards: 1 },
      tags: [
        { tag: 'messaging', cards: 1 },
        { tag: 'messaging::rabbitmq', cards: 1 },
        { tag: 'messaging::redis-streams', cards: 1 },
      ],
    })
  })

  it('tagProgress counts learned cards due before tomorrow as due and new cards apart', () => {
    const cards = [
      cardOf('rtod', ['a']),
      cardOf('rtom', ['a'], 'review', '2026-11-16T06:00:00.000Z'),
      cardOf('ltod', ['a'], 'learning', '2026-11-15T21:00:00.000Z'),
      cardOf('rlrn', ['a'], 'relearning', '2026-11-15T21:00:00.000Z'),
      cardOf('new1', ['a'], 'new', '2026-11-01T10:00:00.000Z'),
    ]

    expect(progressOf(cards).deck).toMatchObject({ cards: 5, new: 1, due: 3 })
  })

  it('tagProgress leaves out of due a card with a review voided today', () => {
    const cards = [cardOf('void', ['a']), cardOf('kept', ['a'])]
    const reviews = [
      reviewOf('void', '2026-11-15T06:00:00.000Z', { flag: 'badly-written' }),
      reviewOf('kept', '2026-11-15T04:59:59.000Z', { flag: 'badly-written' }),
    ]

    expect(progressOf(cards, reviews).deck).toMatchObject({ due: 1 })
  })

  it('tagProgress on an empty deck gives a deck of zeros and no tags', () => {
    expect(progressOf([])).toMatchObject({ deck: { cards: 0, new: 0, due: 0 }, tags: [] })
  })
})
