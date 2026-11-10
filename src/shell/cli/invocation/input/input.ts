import type { z } from 'zod'
import { FIELD_SEPARATOR } from './input.constants.ts'

function fieldOf(path: PropertyKey[]): string {
  return path
    .map((key) => (typeof key === 'number' ? `[${key}]` : `.${String(key)}`))
    .join('')
    .slice(1)
}

function issueMessages(issue: z.core.$ZodIssue, unknownField: string, depth: number): string[] {
  if (issue.code === 'unrecognized_keys') return issue.keys.map((key) => `${key}: ${unknownField}`)
  return [`${fieldOf(issue.path.slice(depth))}: ${issue.message}`]
}

export function fieldMessages(issues: z.core.$ZodIssue[], unknownField: string, depth = 0): string {
  return issues.flatMap((issue) => issueMessages(issue, unknownField, depth)).join(FIELD_SEPARATOR)
}
