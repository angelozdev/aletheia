import { z } from 'zod'
import { GRADES } from '#core/scheduling'

export const reviewSchema = z.object({
  card: z.string(),
  grade: z.enum(GRADES),
  claudeGrade: z.enum(GRADES),
  answer: z.string(),
  rationale: z.string(),
})
