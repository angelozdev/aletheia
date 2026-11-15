import { z } from 'zod'

export const cardListFlagsSchema = z.object({
  weak: z.boolean().optional(),
  gaps: z.boolean().optional(),
})
