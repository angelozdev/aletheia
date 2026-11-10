import type { z } from 'zod'
import { fieldMessages } from '../../invocation/input/input.ts'
import { CARD_SEPARATOR, EXPECTED_CARD_LIST, NOT_A_CARD_FIELD } from './card-add.constants.ts'

function cardMessages(issues: z.core.$ZodIssue[]): string[] {
  return [...Map.groupBy(issues, (issue) => Number(issue.path[0]))]
    .toSorted(([a], [b]) => a - b)
    .map(
      ([index, cardIssues]) =>
        `card ${index + 1}: ${fieldMessages(cardIssues, NOT_A_CARD_FIELD, 1)}`,
    )
}

export class InvalidCardsError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(cardMessages(issues).join(CARD_SEPARATOR))
    this.name = new.target.name
  }
}

export class ExpectedCardListError extends Error {
  constructor() {
    super(EXPECTED_CARD_LIST)
    this.name = new.target.name
  }
}
