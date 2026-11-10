import type { z } from 'zod'
import { FIELD_SEPARATOR, NOT_A_CARD_FIELD } from './card-add.constants.ts'

function fieldOf(path: PropertyKey[]): string {
  return path
    .map((key) => (typeof key === 'number' ? `[${key}]` : `.${String(key)}`))
    .join('')
    .slice(1)
}

function fieldMessages(issue: z.core.$ZodIssue): string[] {
  if (issue.code === 'unrecognized_keys')
    return issue.keys.map((key) => `${key}: ${NOT_A_CARD_FIELD}`)
  return [`${fieldOf(issue.path.slice(1))}: ${issue.message}`]
}

export class InvalidCardsError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    const position = Number(issues[0]?.path[0]) + 1
    super(`card ${position}: ${issues.flatMap(fieldMessages).join(FIELD_SEPARATOR)}`)
    this.name = new.target.name
  }
}
