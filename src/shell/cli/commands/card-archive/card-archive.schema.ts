import { z } from 'zod'
import { requiredText } from '../../invocation/input/input.schema.ts'

export const archiveSchema = z.strictObject({ card: requiredText, reason: requiredText })
