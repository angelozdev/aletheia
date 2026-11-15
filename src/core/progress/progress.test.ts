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
    expect(progressOf([])).toMatchObject({
      deck: { cards: 0, new: 0, due: 0, retention: null },
      tags: [],
    })
  })

  describe('006-US1-AS2 retention is the share passed of the counted reviews of the last 30 days', () => {
    const IN_WINDOW = '2026-11-10T15:00:00.000Z'

    it('pools the counted reviews of the cards a row covers, as a whole percent', () => {
      const cards = [cardOf('aaaa', ['a']), cardOf('bbbb', ['a']), cardOf('cccc', ['b'])]
      const reviews = [
        reviewOf('aaaa', IN_WINDOW),
        reviewOf('aaaa', IN_WINDOW, { grade: 'again' }),
        reviewOf('bbbb', IN_WINDOW),
        reviewOf('cccc', IN_WINDOW, { stateBefore: 'new' }),
      ]

      expect(progressOf(cards, reviews)).toMatchObject({
        deck: { retention: 67 },
        tags: [
          { tag: 'a', retention: 67 },
          { tag: 'b', retention: null },
        ],
      })
    })

    it('leaves out reviews of cards not yet learned, voided reviews and reviews before the window', () => {
      const cards = [cardOf('aaaa', ['a'])]
      const reviews = [
        reviewOf('aaaa', IN_WINDOW, { grade: 'again' }),
        reviewOf('aaaa', IN_WINDOW, { stateBefore: 'new' }),
        reviewOf('aaaa', IN_WINDOW, { stateBefore: 'learning' }),
        reviewOf('aaaa', IN_WINDOW, { stateBefore: 'relearning' }),
        reviewOf('aaaa', IN_WINDOW, { flag: 'badly-written' }),
        reviewOf('aaaa', IN_WINDOW, { grade: 'easy', flag: 'badly-rephrased' }),
        reviewOf('aaaa', '2026-10-17T04:59:59.000Z'),
      ]

      expect(progressOf(cards, reviews).deck).toMatchObject({ retention: 0 })
    })

    it('counts a missing-prerequisite Again as not passed', () => {
      const cards = [cardOf('aaaa', ['a'])]
      const reviews = [
        reviewOf('aaaa', IN_WINDOW),
        reviewOf('aaaa', IN_WINDOW, { grade: 'again', flag: 'missing-prerequisite' }),
      ]

      expect(progressOf(cards, reviews).deck).toMatchObject({ retention: 50 })
    })
  })
})
