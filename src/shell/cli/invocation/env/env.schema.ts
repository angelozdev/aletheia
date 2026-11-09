import { isAbsolute } from 'node:path'
import { z } from 'zod'

export const envNameSchema = z.string().regex(/^[a-z][a-z0-9-]*$/)

export const dbPathSchema = z.string().refine(isAbsolute)
