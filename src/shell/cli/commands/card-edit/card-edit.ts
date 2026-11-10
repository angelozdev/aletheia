import { editCard, type CardEdit } from '#core/cards'
import { StoreCardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { shownCard } from '../card-show/card-show.ts'
import { InvalidEditError, NothingToChangeError } from './card-edit.errors.ts'
import { editSchema } from './card-edit.schema.ts'

function editFrom(json: unknown): CardEdit {
  const parsed = editSchema.safeParse(json)
  if (!parsed.success) throw new InvalidEditError(parsed.error.issues)
  const { card: _card, ...changes } = parsed.data
  if (Object.keys(changes).length === 0) throw new NothingToChangeError()
  return parsed.data
}

export const cardEditCommand: CliCommand = {
  group: 'card',
  name: 'edit',
  description: 'change the fields of a card given as JSON on stdin, keeping its schedule',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const changes = editFrom(await readJson(context))
      const card = editCard(changes, {
        repository: new StoreCardRepository(store),
        now: context.clock(),
      })
      return shownCard(card, context.timeZone)
    }),
}
