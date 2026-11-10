import { z } from 'zod'
import { TAG_PATTERN } from '#core/cards'
import { MALFORMED_TAG } from '../card-add/card-add.constants.ts'

export const topicTagSchema = z.string().regex(TAG_PATTERN, MALFORMED_TAG)
