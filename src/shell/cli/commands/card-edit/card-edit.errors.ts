import type { z } from 'zod'
import { fieldMessages } from '../../invocation/input/input.ts'
import { NOT_AN_EDIT_FIELD, NOTHING_TO_CHANGE } from './card-edit.constants.ts'

export class InvalidEditError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(`invalid edit: ${fieldMessages(issues, NOT_AN_EDIT_FIELD)}`)
    this.name = new.target.name
  }
}

export class NothingToChangeError extends Error {
  constructor() {
    super(`invalid edit: ${NOTHING_TO_CHANGE}`)
    this.name = new.target.name
  }
}
