import type { z } from 'zod'
import { fieldMessages } from '../../invocation/input/input.ts'
import { NOT_A_REVIEW_FIELD } from './review-grade.constants.ts'

export class InvalidReviewError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(`invalid review: ${fieldMessages(issues, NOT_A_REVIEW_FIELD)}`)
    this.name = new.target.name
  }
}
