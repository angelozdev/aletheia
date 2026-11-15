import type { Card, CardRepository, CardState } from '#core/cards'
import type { Grade } from '#core/scheduling'
import type { REVIEW_FLAGS } from './reviews.constants.ts'

export type ReviewFlag = (typeof REVIEW_FLAGS)[number]

export type FlagPolicy = {
  schedule: (card: Card, grade: Grade, now: Date) => Card
  hidesUntilTomorrow: boolean
  countsAsIntroduced: boolean
}

export type DueList = { cards: Card[]; nextDue: Date | null }

export type Review = {
  cardId: string
  grade: Grade
  claudeGrade: Grade
  stateBefore: CardState
  reviewedAt: Date
  answer: string
  rationale: string
  flag: ReviewFlag | null
  prerequisiteOf: string | null
  askedQuestion: string | null
}

export type ReviewDraft = {
  card: string
  grade: Grade
  claudeGrade: Grade
  answer: string
  rationale: string
  askedQuestion: string
  flag?: ReviewFlag
  prerequisiteOf?: string
}

export interface ReviewRepository {
  record(review: Review, card: Card): void
  since(instant: Date): Review[]
}

export type GradeCardDeps = { cards: CardRepository; reviews: ReviewRepository; now: Date }
