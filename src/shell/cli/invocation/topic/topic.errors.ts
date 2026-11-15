import { MALFORMED_TAG } from '../../commands/card-add/card-add.constants.ts'
import { FIELD_SEPARATOR } from '../input/input.constants.ts'

export class InvalidTopicError extends Error {
  constructor(tags: string[]) {
    const messages = tags.map((tag) => `${tag}: ${MALFORMED_TAG}`)
    super(`invalid topic: ${messages.join(FIELD_SEPARATOR)}`)
    this.name = new.target.name
  }
}
