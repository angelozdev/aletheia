import { tagTree } from '#core/tags'
import { StoreCardRepository } from '#shell/db'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

export const tagListCommand: CliCommand = {
  group: 'tag',
  name: 'list',
  description: 'list the tags in use, with their ancestors and how many active cards each covers',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const active = new StoreCardRepository(store).active()
      return { tags: tagTree(active) }
    }),
}
