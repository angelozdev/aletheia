import { z } from 'zod'
import { KEEP_REASONS, OVERLAPPING } from '#core/prune'
import { oneOf } from '../../invocation/input/input.schema.ts'
import { MUST_BE_ANOTHER_CARD } from '../review-grade/review-grade.constants.ts'
import { OVERLAPS_GOES_WITH_OVERLAPPING } from './card-keep.constants.ts'

export function keepFlagsSchema(card: string) {
  return z
    .object({ reason: oneOf(KEEP_REASONS), overlaps: z.string().optional() })
    .refine((flags) => (flags.reason === OVERLAPPING) === (flags.overlaps !== undefined), {
      path: ['overlaps'],
      message: OVERLAPS_GOES_WITH_OVERLAPPING,
    })
    .refine((flags) => flags.overlaps !== card, {
      path: ['overlaps'],
      message: MUST_BE_ANOTHER_CARD,
    })
}
