import type { Card } from '#core/cards'
import { dueList, topicList, type DueList, type Review } from '#core/reviews'
import type { SessionInput, SessionList } from './sessions.types.ts'

function eligible({ scope, topic, now, today, tomorrow }: SessionInput): DueList {
  return topic ? topicList(scope, now, today, tomorrow) : dueList(scope, now, tomorrow)
}

function gradedSince(reviews: Review[], start: Date): Set<string> {
  const inSession = reviews.filter(({ reviewedAt }) => reviewedAt >= start)
  return new Set(inSession.map(({ cardId }) => cardId))
}

export function sessionList(input: SessionInput): SessionList {
  const { cards, nextDue } = eligible(input)
  const graded = gradedSince(input.reviews, input.start)
  const wasGraded = (card: Card) => graded.has(card.id)
  const reShows = cards.filter(wasGraded)
  const ungraded = cards.filter((card) => !wasGraded(card))
  const places = Math.max(0, input.limits.sessionSize - graded.size)
  const filled = ungraded.slice(0, places)
  return {
    cards: [...reShows, ...filled],
    remaining: ungraded.length - filled.length,
    heldBack: 0,
    capReached: graded.size >= input.limits.sessionSize,
    nextDue,
  }
}
