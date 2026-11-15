import type { z } from 'zod'
import { fieldMessages } from '../../invocation/input/input.ts'
import { NOT_AN_ARCHIVE_FIELD } from './card-archive.constants.ts'

export class InvalidArchiveError extends Error {
  constructor(issues: z.core.$ZodIssue[]) {
    super(`invalid archive: ${fieldMessages(issues, NOT_AN_ARCHIVE_FIELD)}`)
    this.name = new.target.name
  }
}
