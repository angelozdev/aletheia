import { z } from 'zod'
import { LIMIT_RULES } from '../../invocation/session/session.constants.ts'
import { limit } from '../../invocation/session/session.schema.ts'

export const reviewHistoryFlagsSchema = z.object({ days: limit(LIMIT_RULES.sessionSize) })
