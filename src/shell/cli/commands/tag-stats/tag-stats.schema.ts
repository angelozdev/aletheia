import { z } from 'zod'
import { DEFAULT_TAG_ORDER, TAG_SORT_FIELDS } from '#core/progress'
import { oneOf } from '../../invocation/input/input.schema.ts'

export const tagStatsFlagsSchema = z
  .object({ sort: oneOf(TAG_SORT_FIELDS).optional(), desc: z.boolean().optional() })
  .transform(({ sort, desc }) => ({ field: sort ?? DEFAULT_TAG_ORDER.field, desc: desc === true }))
