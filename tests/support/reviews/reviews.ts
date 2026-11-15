import type { Review } from '#core/reviews'

export function reviewOf(cardId: string, reviewedAt: string, fields: Partial<Review> = {}): Review {
  return {
    cardId,
    grade: 'good',
    claudeGrade: 'good',
    stateBefore: 'review',
    reviewedAt: new Date(reviewedAt),
    answer: 'a',
    rationale: 'r',
    flag: null,
    prerequisiteOf: null,
    askedQuestion: null,
    ...fields,
  }
}
