import { listSession } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { InvalidTopicError } from './review-topic.errors.ts'
import { topicTagSchema } from './review-topic.schema.ts'

function topicFrom(tags: string[]): string[] {
  const malformed = tags.filter((tag) => !topicTagSchema.safeParse(tag).success)
  if (malformed.length > 0) throw new InvalidTopicError(malformed)
  return tags
}

export const reviewTopicCommand: CliCommand = {
  group: 'review',
  name: 'topic',
  argument: { name: '<tags...>', description: 'one or more tags; their descendants are included' },
  description: 'list the active cards under the tags, due or not, due first',
  run: (context, options, tags) =>
    withStore(context, options, async (store) => listSession(store, context, topicFrom(tags))),
}
