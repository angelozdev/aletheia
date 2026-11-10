import { z } from 'zod'
import { REQUIRED } from './input.constants.ts'

export function requiredOr(otherwise?: string) {
  return ({ input }: { input: unknown }) => (input === undefined ? REQUIRED : otherwise)
}

export function oneOf<const T extends readonly [string, ...string[]]>(values: T) {
  const listed = `${values.slice(0, -1).join(', ')} or ${values.at(-1)}`
  return z.enum(values, { error: requiredOr(`must be ${listed}`) })
}

export const requiredText = z
  .string({ error: requiredOr() })
  .refine((value) => value.trim().length > 0, REQUIRED)
