import { z } from 'zod'
import { instantFrom } from '#core/time'
import { IN_THE_FUTURE, INSTANT_WITH_OFFSET, NOT_AN_INSTANT } from './session.constants.ts'

export function sessionFlagsSchema(now: Date) {
  return z.object({
    session: z
      .string()
      .regex(INSTANT_WITH_OFFSET, NOT_AN_INSTANT)
      .transform(instantFrom)
      .refine((start) => start <= now, IN_THE_FUTURE)
      .optional(),
  })
}
