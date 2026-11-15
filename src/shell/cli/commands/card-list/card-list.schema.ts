import { z } from 'zod'
import { LIMIT_RULES } from '../../invocation/session/session.constants.ts'
import { limit } from '../../invocation/session/session.schema.ts'

export const cardListFlagsSchema = z.object({
  weak: z.boolean().optional(),
  gaps: z.boolean().optional(),
  notReviewed: limit(LIMIT_RULES.sessionSize),
})
