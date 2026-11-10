import { z } from 'zod'
import { GRADES } from '#core/scheduling'
import { oneOf, requiredText } from '../../invocation/input/input.schema.ts'

export const reviewSchema = z.strictObject({
  card: requiredText,
  grade: oneOf(GRADES),
  claudeGrade: oneOf(GRADES),
  answer: requiredText,
  rationale: requiredText,
})
