import { ACTIVE_STATUS, ID_ALPHABET, ID_LENGTH, NEW_STATE } from './cards.constants.ts'
import type { AddCardsDeps, Card, CardDraft, RandomIndex } from './cards.types.ts'

export function cardId(randomIndex: RandomIndex): string {
  return Array.from({ length: ID_LENGTH }, () =>
    ID_ALPHABET.charAt(randomIndex(ID_ALPHABET.length)),
  ).join('')
}

export function newCard(draft: CardDraft, id: string, now: Date): Card {
  return {
    ...draft,
    id,
    status: ACTIVE_STATUS,
    state: NEW_STATE,
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
  }
}

export function addCards(
  drafts: CardDraft[],
  { repository, randomIndex, now }: AddCardsDeps,
): string[] {
  const cards = drafts.map((draft) => newCard(draft, cardId(randomIndex), now))
  repository.saveAll(cards)
  return cards.map(({ id }) => id)
}
