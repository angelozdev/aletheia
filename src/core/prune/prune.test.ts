import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import type { Review } from '#core/reviews'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { reviewOf } from '../../../tests/support/reviews/reviews.ts'
import { candidates, kept } from './prune.ts'
import type { Keep, KeepReason, PruneInput } from './prune.types.ts'

const AGAIN = { grade: 'again' } as const
const NOT_USEFUL = { flag: 'not-useful' } as const
const LEECH_FAILURES = 3

function cardOf(id: string, tags = ['a'], savedAt = '2026-10-01T10:00:00.000Z'): Card {
  return { ...newCard({ ...SAMPLE_DRAFT, tags }, id, new Date(savedAt)), state: 'review' }
}

function failed(cardId: string, times: number, fields: Partial<Review> = {}): Review[] {
  return Array.from({ length: times }, (_, index) =>
    reviewOf(cardId, `2026-11-0${index + 1}T15:00:00.000Z`, { ...AGAIN, ...fields }),
  )
}

const KEEP_START = new Date('2026-05-15T20:00:00.000Z')

function inputOf(
  cards: Card[],
  reviews: Review[],
  topic: string[] = [],
  keeps: Keep[] = [],
): PruneInput {
  return { cards, topic, reviews, leechFailures: LEECH_FAILURES, keeps, keepStart: KEEP_START }
}

function keptAt(card: string, reason: KeepReason, at: string, overlaps: string | null = null) {
  return { card, reason, overlaps, keptAt: new Date(at) }
}

function idsOf(cards: Card[], reviews: Review[], keeps: Keep[]): string[] {
  const found = candidates(inputOf(cards, reviews, [], keeps))
  return found.map(({ card }) => card.id)
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
        notUseful: null,
      },
    ])
  })

  it('a card with a not-useful review is a candidate, with the instant and rationale of its latest one', () => {
    const card = cardOf('aaaa')
    const reviews = [
      reviewOf('aaaa', '2026-11-02T15:00:00.000Z', { ...NOT_USEFUL, rationale: 'antes' }),
      reviewOf('aaaa', '2026-11-09T15:00:00.000Z', { ...NOT_USEFUL, rationale: 'después' }),
      reviewOf('aaaa', '2026-11-12T15:00:00.000Z'),
    ]

    const found = candidates(inputOf([card], reviews))

    expect(found).toEqual([
      {
        card,
        reasons: ['not-useful'],
        failures: 0,
        lastFailure: null,
        notUseful: { at: new Date('2026-11-09T15:00:00.000Z'), rationale: 'después' },
      },
    ])
  })

  it('a leech said to be useless is one candidate with both reasons, leech first', () => {
    const reviews = [...failed('aaaa', 3), ...failed('aaaa', 1, NOT_USEFUL)]

    const found = candidates(inputOf([cardOf('aaaa')], reviews))

    expect(found).toMatchObject([{ reasons: ['leech', 'not-useful'], failures: 4 }])
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

  it('a leech kept after its last failure is left out, and back after a failure later than the keep', () => {
    const card = cardOf('aaaa')
    const keeps = [keptAt('aaaa', 'leech', '2026-11-05T15:00:00.000Z')]
    const failures = failed('aaaa', 3)
    const later = reviewOf('aaaa', '2026-11-06T15:00:00.000Z', AGAIN)

    expect(idsOf([card], failures, keeps)).toEqual([])
    expect(idsOf([card], [...failures, later], keeps)).toEqual(['aaaa'])
  })

  it('a not-useful kept within the keep months is left out, and one kept before them is back', () => {
    const card = cardOf('aaaa')
    const reviews = [reviewOf('aaaa', '2026-04-01T15:00:00.000Z', NOT_USEFUL)]
    const recent = [keptAt('aaaa', 'not-useful', '2026-06-01T15:00:00.000Z')]
    const old = [keptAt('aaaa', 'not-useful', '2026-05-01T15:00:00.000Z')]

    expect(idsOf([card], reviews, recent)).toEqual([])
    expect(idsOf([card], reviews, old)).toEqual(['aaaa'])
  })

  it('a leech said to be useless and kept only as not-useful stays a leech', () => {
    const reviews = [...failed('aaaa', 3), ...failed('aaaa', 1, NOT_USEFUL)]
    const keeps = [keptAt('aaaa', 'not-useful', '2026-11-10T15:00:00.000Z')]

    const found = candidates(inputOf([cardOf('aaaa')], reviews, [], keeps))

    expect(found).toMatchObject([{ reasons: ['leech'] }])
  })

  it('kept gives the keeps of the cards in scope from the keep start on, newest first', () => {
    const cards = [cardOf('aaaa', ['a']), cardOf('bbbb', ['b']), cardOf('cccc', ['a'])]
    const keeps = [
      keptAt('aaaa', 'leech', '2026-05-15T19:59:59.000Z'),
      keptAt('aaaa', 'outdated-situation', '2026-05-15T20:00:00.000Z'),
      keptAt('bbbb', 'leech', '2026-11-01T15:00:00.000Z'),
      keptAt('aaaa', 'overlapping', '2026-11-02T15:00:00.000Z', 'cccc'),
      keptAt('zzzz', 'leech', '2026-11-03T15:00:00.000Z'),
    ]

    const underA = kept(inputOf(cards, [], ['a'], keeps))
    const deck = kept(inputOf(cards, [], [], keeps))

    expect(underA).toEqual([keeps[3], keeps[1]])
    expect(deck).toEqual([keeps[3], keeps[2], keeps[1]])
  })

  it('007-US3-AS1 kept under the topic of the other card of an overlap gives that keep', () => {
    const cards = [cardOf('aaaa', ['a']), cardOf('bbbb', ['b'])]
    const keeps = [keptAt('aaaa', 'overlapping', '2026-11-02T15:00:00.000Z', 'bbbb')]

    const underB = kept(inputOf(cards, [], ['b'], keeps))

    expect(underB).toEqual(keeps)
  })
})
