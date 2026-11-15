import { z } from 'zod'
import { CARD_SORT_FIELDS, DEFAULT_CARD_ORDER } from '#core/progress'
import { oneOf } from '../../invocation/input/input.schema.ts'
import { LIMIT_RULES } from '../../invocation/session/session.constants.ts'
import { limit } from '../../invocation/session/session.schema.ts'

export const cardListFlagsSchema = z.object({
  weak: z.boolean().optional(),
  gaps: z.boolean().optional(),
  notReviewed: limit(LIMIT_RULES.sessionSize),
  sort: oneOf(CARD_SORT_FIELDS).default(DEFAULT_CARD_ORDER.field),
  desc: z.boolean().default(DEFAULT_CARD_ORDER.desc),
})
