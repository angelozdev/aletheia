import { z } from 'zod'
import { CARD_TYPES, MAX_KEY_POINTS, MIN_KEY_POINTS, TAG_PATTERN } from '#core/cards'
import { oneOf, requiredOr, requiredText } from '../../invocation/input/input.schema.ts'
import { KEY_POINTS_COUNT, MALFORMED_TAG, NO_TAGS, REPEATED } from './card-add.constants.ts'

const tags = z
  .array(z.string({ error: requiredOr() }).regex(TAG_PATTERN, MALFORMED_TAG), {
    error: requiredOr(),
  })
  .min(1, NO_TAGS)
  .superRefine((values, context) => {
    values.forEach((tag, index) => {
      if (values.indexOf(tag) !== index)
        context.addIssue({ code: 'custom', message: REPEATED, path: [index] })
    })
  })

const cardSchema = z.strictObject({
  type: oneOf(CARD_TYPES),
  question: requiredText,
  answer: requiredText,
  situation: requiredText,
  source: requiredText,
  keyPoints: z
    .array(requiredText, { error: requiredOr() })
    .min(MIN_KEY_POINTS, KEY_POINTS_COUNT)
    .max(MAX_KEY_POINTS, KEY_POINTS_COUNT),
  tags,
})

export const cardListSchema = z.array(cardSchema).min(1)
