import { NEW_STATE, type Card } from '#core/cards'
import { LEARNING_STATES, REVIEW_STATE } from './reviews.constants.ts'
import type { DueList } from './reviews.types.ts'

function byDue(a: Card, b: Card): number {
  return a.due.getTime() - b.due.getTime()
}

function bySaved(a: Card, b: Card): number {
  return a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id)
}

function earliestDue(cards: Card[]): Date | null {
  return cards.toSorted(byDue)[0]?.due ?? null
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
  const due = [...learning, ...review, ...fresh]
  const listed = new Set(due)
  const leftOut = cards.filter((card) => !listed.has(card))
  return { cards: due, nextDue: earliestDue(leftOut) }
}
