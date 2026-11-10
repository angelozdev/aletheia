import { FIELD_SEPARATOR } from '../../invocation/input/input.constants.ts'
import { MALFORMED_TAG } from '../card-add/card-add.constants.ts'

export class InvalidTopicError extends Error {
  constructor(tags: string[]) {
    const messages = tags.map((tag) => `${tag}: ${MALFORMED_TAG}`)
    super(`invalid topic: ${messages.join(FIELD_SEPARATOR)}`)
    this.name = new.target.name
  }
}
