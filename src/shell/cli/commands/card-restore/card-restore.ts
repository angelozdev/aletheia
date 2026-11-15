import { restoreCard } from '#core/cards'
import { StoreCardRepository } from '#shell/db'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { shownCard } from '../card-show/card-show.ts'

export const cardRestoreCommand: CliCommand = {
  group: 'card',
  name: 'restore',
  argument: { name: '<id>', description: 'the id of the archived card' },
  description: 'make an archived card active again, with the schedule it had',
  run: (context, options, [id]) =>
    withStore(context, options, async (store) => {
      const repository = new StoreCardRepository(store)
      const card = restoreCard(id, { repository, now: context.clock() })
      return shownCard(card, repository.archiveOf(id), context.timeZone)
    }),
}
