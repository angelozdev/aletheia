import type { Card } from '#core/cards'
import { dueList } from '#core/reviews'
import { topicCards } from '#core/tags'
import { shownInstant, startOfTomorrow } from '#core/time'
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

function inScope(active: Card[], scope: Scope): Card[] {
  return scope === 'all' ? active : topicCards(active, scope)
}

export function listSession(store: Store, context: CliContext, scope: Scope) {
  const now = context.clock()
  const tomorrow = startOfTomorrow(now, context.timeZone)
  const active = new StoreCardRepository(store).active()
  const { cards, nextDue } = dueList(inScope(active, scope), now, tomorrow)
  return {
    count: cards.length,
    nextDue: nextDue === null ? null : shownInstant(nextDue, context.timeZone),
    cards: cards.map(dueItem),
  }
}
