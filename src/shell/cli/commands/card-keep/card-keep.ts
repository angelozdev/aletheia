import { keepCard } from '#core/prune'
import { shownInstant } from '#core/time'
import { StoreCardRepository, StoreKeepRepository } from '#shell/db'
import { progressInput } from '../../invocation/progress/progress.ts'
import { optionsFrom } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { CARD_KEEP_OPTIONS } from './card-keep.constants.ts'
import { keepFlagsSchema } from './card-keep.schema.ts'

export const cardKeepCommand: CliCommand = {
  group: 'card',
  name: 'keep',
  argument: { name: '<id>', description: 'the id of the candidate Angelo keeps' },
  description: 'record that Angelo keeps a candidate for one reason, so it is not proposed again',
  options: CARD_KEEP_OPTIONS,
  run: (context, options, [card], flags) =>
    withStore(context, options, async (store) => {
      const { reason, overlaps = null } = optionsFrom(keepFlagsSchema(card), flags)
      const keep = keepCard(
        { card, reason, overlaps },
        {
          cards: new StoreCardRepository(store),
          keeps: new StoreKeepRepository(store),
          now: context.clock(),
          evidence: progressInput(store, context, []),
        },
      )
      return { ...keep, keptAt: shownInstant(keep.keptAt, context.timeZone) }
    }),
}
