import { describe, expect, it } from 'vitest'
import { countingDraw } from '../../../tests/support/draws/draws.ts'
import { CardIdTakenError } from './cards.errors.ts'
import { addCards, cardId, newCard } from './cards.ts'
import type { Card, CardRepository } from './cards.types.ts'
import { SAMPLE_DRAFT as draft } from '../../../tests/support/cards/cards.constants.ts'

const now = new Date('2026-11-09T15:00:00.000Z')

function refusingRepository(refusals: number): CardRepository & { saved: Card[][] } {
  let refused = 0
  const saved: Card[][] = []
  return {
    saved,
    saveAll(cards) {
      if (refused++ < refusals) throw new CardIdTakenError()
      saved.push(cards)
    },
    find: () => null,
    active: () => [],
    matching: () => [],
  }
}

describe('cards', () => {
  it('cardId draws four characters of the id alphabet', () => {
    const draws = [19, 7, 20, 2]
    const bounds: number[] = []

    const id = cardId((bound) => {
      bounds.push(bound)
      return draws[bounds.length - 1] ?? 0
    })

    expect(id).toBe('k7m2')
    expect(bounds).toEqual([32, 32, 32, 32])
  })

  it('newCard starts a card active and new, due at once', () => {
    expect(newCard(draft, 'k7m2', now)).toEqual({
      ...draft,
      id: 'k7m2',
      status: 'active',
      state: 'new',
      due: now,
      stability: 0,
      difficulty: 0,
      scheduledDays: 0,
      learningSteps: 0,
      reps: 0,
      lapses: 0,
      lastReview: null,
      createdAt: now,
      updatedAt: now,
    })
  })

  it('addCards draws again when an id is taken', () => {
    const repository = refusingRepository(1)

    const ids = addCards([draft], { repository, randomIndex: countingDraw(), now })

    expect(ids).toEqual(['4567'])
    expect(repository.saved).toEqual([[newCard(draft, '4567', now)]])
  })

  it('addCards gives up after five draws', () => {
    const repository = refusingRepository(5)

    expect(() => addCards([draft], { repository, randomIndex: countingDraw(), now })).toThrow(
      'no free card id after 5 draws',
    )
    expect(repository.saved).toEqual([])
  })
})
