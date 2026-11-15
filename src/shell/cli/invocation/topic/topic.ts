import { InvalidTopicError } from './topic.errors.ts'
import { topicTagSchema } from './topic.schema.ts'

export function topicFrom(tags: string[]): string[] {
  const malformed = tags.filter((tag) => !topicTagSchema.safeParse(tag).success)
  if (malformed.length > 0) throw new InvalidTopicError(malformed)
  return tags
}
