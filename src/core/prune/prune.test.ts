import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import type { Review } from '#core/reviews'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { reviewOf } from '../../../tests/support/reviews/reviews.ts'
import { candidates } from './prune.ts'
import type { PruneInput } from './prune.types.ts'

const AGAIN = { grade: 'again' } as const
const LEECH_FAILURES = 3

function cardOf(id: string, tags = ['a'], savedAt = '2026-10-01T10:00:00.000Z'): Card {
  return { ...newCard({ ...SAMPLE_DRAFT, tags }, id, new Date(savedAt)), state: 'review' }
}

function failed(cardId: string, times: number, fields: Partial<Review> = {}): Review[] {
  return Array.from({ length: times }, (_, index) =>
    reviewOf(cardId, `2026-11-0${index + 1}T15:00:00.000Z`, { ...AGAIN, ...fields }),
  )
}

function inputOf(cards: Card[], reviews: Review[], topic: string[] = []): PruneInput {
  return { cards, topic, reviews, leechFailures: LEECH_FAILURES }
}

describe('prune candidates', () => {
  it('a card with as many counted failures as the leech setting is a leech, with its failures and its last one', () => {
    const card = cardOf('aaaa')
    const reviews = [...failed('aaaa', 3), reviewOf('aaaa', '2026-11-10T15:00:00.000Z')]

    const found = candidates(inputOf([card], reviews))

    expect(found).toEqual([
      {
        card,
        reasons: ['leech'],
        failures: 3,
        lastFailure: new Date('2026-11-03T15:00:00.000Z'),
      },
    ])
  })

  it('2 failures, a voided Again, a missing-prerequisite Again and an Again before learning do not make a leech', () => {
    const reviews = [
      ...failed('aaaa', 2),
      ...failed('aaaa', 1, { flag: 'badly-written' }),
      ...failed('aaaa', 1, { flag: 'missing-prerequisite' }),
      ...failed('aaaa', 1, { stateBefore: 'learning' }),
    ]

    const found = candidates(inputOf([cardOf('aaaa')], reviews))

    expect(found).toEqual([])
  })

  it('gives the candidates in the order the cards were saved, under the topic when there is one', () => {
    const later = cardOf('bbbb', ['b'], '2026-10-02T10:00:00.000Z')
    const earlier = cardOf('aaaa', ['a'], '2026-10-01T10:00:00.000Z')
    const reviews = [...failed('bbbb', 3), ...failed('aaaa', 3)]
    const ids = (topic: string[]) => {
      const found = candidates(inputOf([later, earlier], reviews, topic))
      return found.map(({ card }) => card.id)
    }

    expect(ids([])).toEqual(['aaaa', 'bbbb'])
    expect(ids(['b'])).toEqual(['bbbb'])
    expect(() => candidates(inputOf([later, earlier], reviews, ['c']))).toThrow(
      'no active card under c',
    )
  })
})
