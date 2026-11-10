import { cardById, NEW_STATE, type Card } from '#core/cards'
import { scheduleAfter } from '#core/scheduling'
import { minutesAfter } from '#core/time'
import { LEARN_AHEAD_MINUTES, LEARNING_STATES, REVIEW_STATE } from './reviews.constants.ts'
import type { DueList, GradeCardDeps, ReviewDraft } from './reviews.types.ts'

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

function learningDueBy(cards: Card[], instant: Date): Card[] {
  return cards.filter((card) => isLearning(card) && card.due <= instant).toSorted(byDue)
}

function dueNow(cards: Card[], now: Date, tomorrow: Date): Card[] {
  const review = cards
    .filter((card) => card.state === REVIEW_STATE && card.due < tomorrow)
    .toSorted(byDue)
  const fresh = cards.filter((card) => card.state === NEW_STATE).toSorted(bySaved)
  return [...learningDueBy(cards, now), ...review, ...fresh]
}

export function dueList(cards: Card[], now: Date, tomorrow: Date): DueList {
  const dueToday = dueNow(cards, now, tomorrow)
  const learnAhead = minutesAfter(now, LEARN_AHEAD_MINUTES)
  const due = dueToday.length > 0 ? dueToday : learningDueBy(cards, learnAhead)
  const listed = new Set(due)
  const leftOut = cards.filter((card) => !listed.has(card))
  return { cards: due, nextDue: earliestDue(leftOut) }
}

export function gradeCard(draft: ReviewDraft, { cards, reviews, now }: GradeCardDeps): Card {
  const card = cardById(cards, draft.card)
  const graded = scheduleAfter(card, draft.grade, now)
  reviews.record(
    {
      cardId: card.id,
      grade: draft.grade,
      claudeGrade: draft.claudeGrade,
      stateBefore: card.state,
      reviewedAt: now,
      answer: draft.answer,
      rationale: draft.rationale,
    },
    graded,
  )
  return graded
}
