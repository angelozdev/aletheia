import { z } from 'zod'
import { CARD_TYPES, MAX_KEY_POINTS, MIN_KEY_POINTS, TAG_PATTERN } from '#core/cards'
import {
  KEY_POINTS_COUNT,
  MALFORMED_TAG,
  NO_TAGS,
  REPEATED,
  REQUIRED,
} from './card-add.constants.ts'

function requiredOr(otherwise?: string) {
  return ({ input }: { input: unknown }) => (input === undefined ? REQUIRED : otherwise)
}

function listed(values: readonly string[]): string {
  return `${values.slice(0, -1).join(', ')} or ${values.at(-1)}`
}

const text = z.string({ error: requiredOr() }).refine((value) => value.trim().length > 0, REQUIRED)

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
  type: z.enum(CARD_TYPES, { error: requiredOr(`must be ${listed(CARD_TYPES)}`) }),
  question: text,
  answer: text,
  situation: text,
  source: text,
  keyPoints: z
    .array(text, { error: requiredOr() })
    .min(MIN_KEY_POINTS, KEY_POINTS_COUNT)
    .max(MAX_KEY_POINTS, KEY_POINTS_COUNT),
  tags,
})

export const cardListSchema = z.array(cardSchema)
