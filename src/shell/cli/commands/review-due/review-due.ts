import { SESSION_OPTIONS } from '../../invocation/session/session.constants.ts'
import { listSession, sessionFrom } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

export const reviewDueCommand: CliCommand = {
  group: 'review',
  name: 'due',
  options: SESSION_OPTIONS,
  description: 'list the cards due now, studied first',
  run: (context, options, _args, flags) =>
    withStore(context, options, async (store) => {
      const session = sessionFrom(flags, context)
      return listSession(store, context, 'all', session)
    }),
}
