import type { Card } from '#core/cards'
import { dueList, topicList, type DueList } from '#core/reviews'
import { topicCards } from '#core/tags'
import { shownInstant, startOfToday, startOfTomorrow } from '#core/time'
import { StoreCardRepository, type Store } from '#shell/db'
import type { CliContext } from '../../main/main.types.ts'
import type { Scope } from './session.types.ts'

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

function eligible(active: Card[], scope: Scope, context: CliContext): DueList {
  const now = context.clock()
  const tomorrow = startOfTomorrow(now, context.timeZone)
  if (scope === 'all') return dueList(active, now, tomorrow)
  const today = startOfToday(now, context.timeZone)
  return topicList(topicCards(active, scope), now, today, tomorrow)
}

export function listSession(store: Store, context: CliContext, scope: Scope) {
  const active = new StoreCardRepository(store).active()
  const { cards, nextDue } = eligible(active, scope, context)
  return {
    count: cards.length,
    nextDue: nextDue === null ? null : shownInstant(nextDue, context.timeZone),
    cards: cards.map(dueItem),
  }
}
