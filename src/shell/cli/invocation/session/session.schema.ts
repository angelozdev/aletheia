import { z } from 'zod'
import { instantFrom } from '#core/time'
import {
  IN_THE_FUTURE,
  INSTANT_WITH_OFFSET,
  MAX_PERCENT,
  NOT_AN_INSTANT,
  WHOLE_FROM_ONE,
  WHOLE_FROM_ZERO,
  WHOLE_NUMBER,
  WHOLE_PERCENT,
} from './session.constants.ts'

function wholeNumber(message: string, min: number, max = Infinity) {
  return z
    .string()
    .regex(WHOLE_NUMBER, message)
    .transform(Number)
    .refine((value) => value >= min && value <= max, message)
}

export function sessionFlagsSchema(now: Date) {
  return z.object({
    session: z
      .string()
      .regex(INSTANT_WITH_OFFSET, NOT_AN_INSTANT)
      .transform(instantFrom)
      .refine((start) => start <= now, IN_THE_FUTURE)
      .optional(),
    sessionSize: wholeNumber(WHOLE_FROM_ONE, 1).optional(),
    newPerDay: wholeNumber(WHOLE_FROM_ZERO, 0).optional(),
    newShare: wholeNumber(WHOLE_PERCENT, 0, MAX_PERCENT).optional(),
  })
}
