import { archiveCard, type ArchiveDraft } from '#core/cards'
import { StoreCardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { shownCard } from '../card-show/card-show.ts'
import { InvalidArchiveError } from './card-archive.errors.ts'
import { archiveSchema } from './card-archive.schema.ts'

function archiveFrom(json: unknown): ArchiveDraft {
  const parsed = archiveSchema.safeParse(json)
  if (!parsed.success) throw new InvalidArchiveError(parsed.error.issues)
  return parsed.data
}

export const cardArchiveCommand: CliCommand = {
  group: 'card',
  name: 'archive',
  description:
    'archive an active card with the reason given as JSON on stdin, keeping its schedule',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const draft = archiveFrom(await readJson(context))
      const repository = new StoreCardRepository(store)
      const card = archiveCard(draft, { repository, now: context.clock() })
      return shownCard(card, repository.archiveOf(card.id), context.timeZone)
    }),
}
