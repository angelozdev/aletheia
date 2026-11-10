import { TOPIC_TAG_SEPARATOR } from './tags.constants.ts'

export class NoActiveCardUnderError extends Error {
  readonly tags: string[]

  constructor(tags: string[]) {
    super(`no active card under ${tags.join(TOPIC_TAG_SEPARATOR)}`)
    this.name = new.target.name
    this.tags = tags
  }
}
