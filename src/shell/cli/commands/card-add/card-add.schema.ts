import { z } from 'zod'
import { CARD_TYPES } from '#core/cards'

const cardSchema = z.object({
  type: z.enum(CARD_TYPES),
  question: z.string(),
  answer: z.string(),
  keyPoints: z.array(z.string()),
  situation: z.string(),
  tags: z.array(z.string()),
  source: z.string(),
})

export const cardListSchema = z.array(cardSchema)
