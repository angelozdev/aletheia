import { activeCardById, bySaved, NEW_STATE, type Card } from '#core/cards'
import { AGAIN_GRADE } from '#core/scheduling'
import { minutesAfter } from '#core/time'
import {
  FLAG_POLICIES,
  LEARN_AHEAD_MINUTES,
  LEARNING_STATES,
  MISSING_PREREQUISITE,
  NO_FLAG,
  REVIEW_STATE,
} from './reviews.constants.ts'
import type {
  DueList,
  FlagPolicy,
  GradeCardDeps,
  Review,
  ReviewDraft,
  ReviewFlag,
} from './reviews.types.ts'

function byDue(a: Card, b: Card): number {
  return a.due.getTime() - b.due.getTime()
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

function listOf(cards: Card[], listed: Card[]): DueList {
  const inList = new Set(listed)
  const leftOut = cards.filter((card) => !inList.has(card))
  return { cards: listed, nextDue: earliestDue(leftOut) }
}

function dueCards(cards: Card[], now: Date, tomorrow: Date): Card[] {
  const dueToday = dueNow(cards, now, tomorrow)
  const learnAhead = minutesAfter(now, LEARN_AHEAD_MINUTES)
  return dueToday.length > 0 ? dueToday : learningDueBy(cards, learnAhead)
}

export function dueList(cards: Card[], now: Date, tomorrow: Date): DueList {
  return listOf(cards, dueCards(cards, now, tomorrow))
}

function gradedSince(card: Card, instant: Date): boolean {
  return card.lastReview !== null && card.lastReview >= instant
}

export function topicList(cards: Card[], now: Date, today: Date, tomorrow: Date): DueList {
  const notDue = cards
    .filter(
      (card) => card.state === REVIEW_STATE && card.due >= tomorrow && !gradedSince(card, today),
    )
    .toSorted(byDue)
  const due = dueCards(cards, now, tomorrow)
  return listOf(cards, [...due, ...notDue])
}

export function policyOf(flag: ReviewFlag | null): FlagPolicy {
  return flag === null ? NO_FLAG : FLAG_POLICIES[flag]
}

export function isCounted({ flag, stateBefore }: Review): boolean {
  return policyOf(flag).countsInStats && stateBefore === REVIEW_STATE
}

export function isFailure(review: Review): boolean {
  return isCounted(review) && review.grade === AGAIN_GRADE && review.flag !== MISSING_PREREQUISITE
}

export function gradeCard(draft: ReviewDraft, { cards, reviews, now }: GradeCardDeps): Card {
  const card = activeCardById(cards, draft.card)
  if (draft.prerequisiteOf !== undefined) activeCardById(cards, draft.prerequisiteOf)
  const graded = policyOf(draft.flag ?? null).schedule(card, draft.grade, now)
  reviews.record(
    {
      cardId: card.id,
      grade: draft.grade,
      claudeGrade: draft.claudeGrade,
      stateBefore: card.state,
      reviewedAt: now,
      answer: draft.answer,
      rationale: draft.rationale,
      flag: draft.flag ?? null,
      prerequisiteOf: draft.prerequisiteOf ?? null,
      askedQuestion: draft.askedQuestion,
    },
    graded,
  )
  return graded
}
