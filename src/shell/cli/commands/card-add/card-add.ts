import { addCards } from '#core/cards'
import { cardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { InvalidCardsError } from './card-add.errors.ts'
import { cardListSchema } from './card-add.schema.ts'

export const cardAddCommand: CliCommand = {
  group: 'card',
  name: 'add',
  description: 'save the cards given as JSON on stdin, all or none',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const parsed = cardListSchema.safeParse(await readJson(context))
      if (!parsed.success) throw new InvalidCardsError(parsed.error.issues)
      const ids = addCards(parsed.data, {
        repository: cardRepository(store),
        randomIndex: context.randomIndex,
        now: context.clock(),
      })
      return { ids }
    }),
}
