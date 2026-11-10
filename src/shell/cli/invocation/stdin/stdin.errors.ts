import { LINE_BREAKS } from './stdin.constants.ts'

export class InvalidJsonError extends Error {
  constructor(cause: Error) {
    super(`invalid JSON on stdin: ${cause.message.replaceAll(LINE_BREAKS, ' ')}`, { cause })
    this.name = new.target.name
  }
}
