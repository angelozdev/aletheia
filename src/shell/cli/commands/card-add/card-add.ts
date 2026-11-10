import { addCards } from '#core/cards'
import { cardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { cardListSchema } from './card-add.schema.ts'

export const cardAddCommand: CliCommand = {
  group: 'card',
  name: 'add',
  description: 'save the cards given as JSON on stdin, all or none',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const drafts = cardListSchema.parse(await readJson(context))
      const ids = addCards(drafts, {
        repository: cardRepository(store),
        randomIndex: context.randomIndex,
        now: context.clock(),
      })
      return { ids }
    }),
}
