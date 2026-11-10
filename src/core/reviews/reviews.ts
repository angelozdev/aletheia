import { NEW_STATE, type Card } from '#core/cards'
import { LEARNING_STATES, REVIEW_STATE } from './reviews.constants.ts'
import type { DueList } from './reviews.types.ts'

function byDue(a: Card, b: Card): number {
  return a.due.getTime() - b.due.getTime()
}

function bySaved(a: Card, b: Card): number {
  return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
}

function isLearning(card: Card): boolean {
  return LEARNING_STATES.includes(card.state)
}

export function dueList(cards: Card[], now: Date, tomorrow: Date): DueList {
  const learning = cards.filter((card) => isLearning(card) && card.due <= now).toSorted(byDue)
  const review = cards
    .filter((card) => card.state === REVIEW_STATE && card.due < tomorrow)
    .toSorted(byDue)
  const fresh = cards.filter((card) => card.state === NEW_STATE).toSorted(bySaved)
  return { cards: [...learning, ...review, ...fresh], nextDue: null }
}
