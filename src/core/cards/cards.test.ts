import { describe, expect, it } from 'vitest'
import { cardId, newCard } from './cards.ts'
import { SAMPLE_DRAFT as draft } from '../../../tests/support/cards/cards.constants.ts'

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
    const now = new Date('2026-11-09T15:00:00.000Z')

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
})
