import { listSession } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

export const reviewDueCommand: CliCommand = {
  group: 'review',
  name: 'due',
  description: 'list the cards due now, studied first',
  run: (context, options) =>
    withStore(context, options, async (store) => listSession(store, context, 'all')),
}
