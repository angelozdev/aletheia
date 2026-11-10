import type { Card, CardRepository, CardState } from '#core/cards'
import type { Grade } from '#core/scheduling'

export type DueList = { cards: Card[]; nextDue: Date | null }

export type Review = {
  cardId: string
  grade: Grade
  claudeGrade: Grade
  stateBefore: CardState
  reviewedAt: Date
  answer: string
  rationale: string
}

export type ReviewDraft = {
  card: string
  grade: Grade
  claudeGrade: Grade
  answer: string
  rationale: string
}

export interface ReviewRepository {
  record(review: Review, card: Card): void
}

export type GradeCardDeps = { cards: CardRepository; reviews: ReviewRepository; now: Date }
