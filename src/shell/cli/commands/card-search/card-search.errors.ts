import type { z } from 'zod'
import { fieldMessages } from '../../invocation/input/input.ts'
import { EMPTY_SEARCH, NOT_A_SEARCH_FIELD } from './card-search.constants.ts'

export class InvalidSearchError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(`invalid search: ${fieldMessages(issues, NOT_A_SEARCH_FIELD)}`)
    this.name = new.target.name
  }
}

export class EmptySearchError extends Error {
  constructor() {
    super(`invalid search: ${EMPTY_SEARCH}`)
    this.name = new.target.name
  }
}
