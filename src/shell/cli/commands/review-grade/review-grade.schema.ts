import { z } from 'zod'
import { MISSING_PREREQUISITE, REVIEW_FLAGS } from '#core/reviews'
import { AGAIN_GRADE, GRADES } from '#core/scheduling'
import { oneOf, requiredText } from '../../invocation/input/input.schema.ts'
import { GAP_NEEDS_AGAIN, MUST_BE_ANOTHER_CARD } from './review-grade.constants.ts'

export const reviewSchema = z
  .strictObject({
    card: requiredText,
    grade: oneOf(GRADES),
    claudeGrade: oneOf(GRADES),
    answer: requiredText,
    rationale: requiredText,
    flag: oneOf(REVIEW_FLAGS).optional(),
    prerequisiteOf: requiredText.optional(),
  })
  .refine((review) => review.flag !== MISSING_PREREQUISITE || review.grade === AGAIN_GRADE, {
    path: ['flag'],
    message: GAP_NEEDS_AGAIN,
  })
  .refine((review) => review.prerequisiteOf !== review.card, {
    path: ['prerequisiteOf'],
    message: MUST_BE_ANOTHER_CARD,
  })
