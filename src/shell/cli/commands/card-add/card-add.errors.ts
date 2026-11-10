import type { z } from 'zod'
import { CARD_SEPARATOR, FIELD_SEPARATOR, NOT_A_CARD_FIELD } from './card-add.constants.ts'

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

function cardMessages(issues: z.core.$ZodIssue[]): string[] {
  return [...Map.groupBy(issues, (issue) => Number(issue.path[0]))]
    .toSorted(([a], [b]) => a - b)
    .map(
      ([index, cardIssues]) =>
        `card ${index + 1}: ${cardIssues.flatMap(fieldMessages).join(FIELD_SEPARATOR)}`,
    )
}

export class InvalidCardsError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(cardMessages(issues).join(CARD_SEPARATOR))
    this.name = new.target.name
  }
}
