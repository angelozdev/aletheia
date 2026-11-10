import { z } from 'zod'

export const searchSchema = z.strictObject({ words: z.string() })
