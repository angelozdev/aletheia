import { z } from 'zod'
import { REVIEW_FLAGS } from '#core/reviews'
import { GRADES } from '#core/scheduling'
import { oneOf } from '../../invocation/input/input.schema.ts'
import { LIMIT_RULES } from '../../invocation/session/session.constants.ts'
import { limit } from '../../invocation/session/session.schema.ts'

export const reviewHistoryFlagsSchema = z.object({
  days: limit(LIMIT_RULES.sessionSize),
  grade: oneOf(GRADES).optional(),
  flag: oneOf(REVIEW_FLAGS).optional(),
})
