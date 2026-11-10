import { addCards, type CardDraft } from '#core/cards'
import { StoreCardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { ExpectedCardListError, InvalidCardsError } from './card-add.errors.ts'
import { cardListSchema } from './card-add.schema.ts'

function draftsFrom(json: unknown): CardDraft[] {
  const parsed = cardListSchema.safeParse(json)
  if (parsed.success) return parsed.data
  if (parsed.error.issues.some(({ path }) => path.length === 0)) throw new ExpectedCardListError()
  throw new InvalidCardsError(parsed.error.issues)
}

export const cardAddCommand: CliCommand = {
  group: 'card',
  name: 'add',
  description: 'save the cards given as JSON on stdin, all or none',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const ids = addCards(draftsFrom(await readJson(context)), {
        repository: new StoreCardRepository(store),
        randomIndex: context.randomIndex,
        now: context.clock(),
      })
      return { ids }
    }),
}
