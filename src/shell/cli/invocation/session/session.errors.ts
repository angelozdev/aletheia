import { FIELD_SEPARATOR } from '../input/input.constants.ts'

export class InvalidOptionsError extends Error {
  constructor(messages: string[]) {
    super(`invalid options: ${messages.join(FIELD_SEPARATOR)}`)
    this.name = new.target.name
  }
}
