import { z } from 'zod'
import { instantFrom } from '#core/time'
import {
  IN_THE_FUTURE,
  INSTANT_WITH_OFFSET,
  NOT_AN_INSTANT,
  WHOLE_FROM_ONE,
  WHOLE_FROM_ZERO,
  WHOLE_NUMBER,
} from './session.constants.ts'

function wholeNumber(min: number, message: string) {
  return z
    .string()
    .regex(WHOLE_NUMBER, message)
    .transform(Number)
    .refine((value) => value >= min, message)
}

export function sessionFlagsSchema(now: Date) {
  return z.object({
    session: z
      .string()
      .regex(INSTANT_WITH_OFFSET, NOT_AN_INSTANT)
      .transform(instantFrom)
      .refine((start) => start <= now, IN_THE_FUTURE)
      .optional(),
    sessionSize: wholeNumber(1, WHOLE_FROM_ONE).optional(),
    newPerDay: wholeNumber(0, WHOLE_FROM_ZERO).optional(),
  })
}
