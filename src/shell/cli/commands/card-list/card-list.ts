import { cardProgress, type CardProgress } from '#core/progress'
import { shownInstant } from '#core/time'
import { progressInput } from '../../invocation/progress/progress.ts'
import { optionsFrom } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { CARD_LIST_OPTIONS } from './card-list.constants.ts'
import { cardListFlagsSchema } from './card-list.schema.ts'

function cardRow({ card, lastReview, failures, gaps, weak }: CardProgress, timeZone: string) {
  return {
    id: card.id,
    question: card.question,
    tags: card.tags,
    state: card.state,
    due: shownInstant(card.due, timeZone),
    lastReview: lastReview === null ? null : shownInstant(lastReview, timeZone),
    failures,
    gaps,
    weak,
  }
}

export const cardListCommand: CliCommand = {
  group: 'card',
  name: 'list',
  argument: { name: '[tags...]', description: 'tags to narrow to; their descendants are included' },
  description:
    'list the active cards matching every filter, with their failures, gaps and last review',
  options: CARD_LIST_OPTIONS,
  run: (context, options, tags, flags) =>
    withStore(context, options, async (store) => {
      const filters = optionsFrom(cardListFlagsSchema, flags)
      const rows = cardProgress(progressInput(store, context, tags), filters)
      return { cards: rows.map((row) => cardRow(row, context.timeZone)) }
    }),
}
