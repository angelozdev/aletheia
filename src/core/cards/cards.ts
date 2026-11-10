import {
  ACTIVE_STATUS,
  ID_ALPHABET,
  ID_LENGTH,
  MAX_ID_DRAWS,
  NEW_STATE,
} from './cards.constants.ts'
import { CardIdTakenError, CardNotFoundError, NoFreeCardIdError } from './cards.errors.ts'
import type { AddCardsDeps, Card, CardDraft, CardRepository, RandomIndex } from './cards.types.ts'

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

function savedWithFreshIds(
  drafts: CardDraft[],
  { repository, randomIndex, now }: AddCardsDeps,
): string[] | null {
  const cards = drafts.map((draft) => newCard(draft, cardId(randomIndex), now))
  try {
    repository.saveAll(cards)
  } catch (error) {
    if (error instanceof CardIdTakenError) return null
    throw error
  }
  return cards.map(({ id }) => id)
}

export function addCards(drafts: CardDraft[], deps: AddCardsDeps): string[] {
  for (let draw = 0; draw < MAX_ID_DRAWS; draw++) {
    const ids = savedWithFreshIds(drafts, deps)
    if (ids !== null) return ids
  }
  throw new NoFreeCardIdError(MAX_ID_DRAWS)
}

export function cardById(repository: CardRepository, id: string): Card {
  const card = repository.find(id)
  if (card === null) throw new CardNotFoundError(id)
  return card
}

export function bySaved(a: Card, b: Card): number {
  return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
}
