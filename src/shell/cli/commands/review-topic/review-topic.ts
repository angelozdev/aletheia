import { listSession } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

export const reviewTopicCommand: CliCommand = {
  group: 'review',
  name: 'topic',
  argument: { name: '<tags...>', description: 'one or more tags; their descendants are included' },
  description: 'list the active cards under the tags, due or not, due first',
  run: (context, options, tags) =>
    withStore(context, options, async (store) => listSession(store, context, tags)),
}
