import { z } from 'zod'
import { TAG_PATTERN } from '#core/cards'
import { MALFORMED_TAG } from '../card-add/card-add.constants.ts'
import { MUST_BE_A_LIST, MUST_BE_TEXT } from './card-search.constants.ts'

export const searchSchema = z.strictObject({
  words: z.string({ error: MUST_BE_TEXT }).optional(),
  tags: z.array(z.string().regex(TAG_PATTERN, MALFORMED_TAG), { error: MUST_BE_A_LIST }).optional(),
})
