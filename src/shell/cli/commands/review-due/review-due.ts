import type { Card } from '#core/cards'
import { dueList } from '#core/reviews'
import { shownInstant, startOfTomorrow } from '#core/time'
import { StoreCardRepository } from '#shell/db'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

function dueItem(card: Card) {
  return {
    id: card.id,
    type: card.type,
    tags: card.tags,
    question: card.question,
    keyPoints: card.keyPoints,
    answer: card.answer,
  }
}

export const reviewDueCommand: CliCommand = {
  group: 'review',
  name: 'due',
  description: 'list the cards due now, studied first',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const now = context.clock()
      const tomorrow = startOfTomorrow(now, context.timeZone)
      const active = new StoreCardRepository(store).active()
      const { cards, nextDue } = dueList(active, now, tomorrow)
      return {
        count: cards.length,
        nextDue: nextDue === null ? null : shownInstant(nextDue, context.timeZone),
        cards: cards.map(dueItem),
      }
    }),
}
