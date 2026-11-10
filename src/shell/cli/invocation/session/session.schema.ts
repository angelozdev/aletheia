import { z } from 'zod'
import { instantFrom } from '#core/time'
import {
  DEFAULT_VALUE,
  IN_THE_FUTURE,
  INSTANT_WITH_OFFSET,
  LIMIT_RULES,
  NOT_AN_INSTANT,
  OR_DEFAULT,
  WHOLE_NUMBER,
} from './session.constants.ts'
import type { LimitRule } from './session.types.ts'

function wholeNumber({ min, max }: LimitRule, message: string) {
  return z
    .string()
    .regex(WHOLE_NUMBER, message)
    .transform(Number)
    .refine((value) => value >= min && value <= max, message)
}

function limit(rule: LimitRule) {
  return wholeNumber(rule, rule.message).optional()
}

function setting(rule: LimitRule) {
  const message = `${rule.message}${OR_DEFAULT}`
  const forget = z.literal(DEFAULT_VALUE).transform(() => null)
  return z.union([forget, wholeNumber(rule, message)], { error: message }).optional()
}

export function sessionFlagsSchema(now: Date) {
  return z.object({
    session: z
      .string()
      .regex(INSTANT_WITH_OFFSET, NOT_AN_INSTANT)
      .transform(instantFrom)
      .refine((start) => start <= now, IN_THE_FUTURE)
      .optional(),
    sessionSize: limit(LIMIT_RULES.sessionSize),
    newPerDay: limit(LIMIT_RULES.newPerDay),
    newShare: limit(LIMIT_RULES.newShare),
  })
}

export const settingFlagsSchema = z.object({
  sessionSize: setting(LIMIT_RULES.sessionSize),
  newPerDay: setting(LIMIT_RULES.newPerDay),
  newShare: setting(LIMIT_RULES.newShare),
})
