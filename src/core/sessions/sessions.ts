import { bySaved, NEW_STATE, type Card } from '#core/cards'
import { dueList, topicList, type DueList, type Review } from '#core/reviews'
import type { SessionInput, SessionList } from './sessions.types.ts'

function eligible(scope: Card[], { topic, now, today, tomorrow }: SessionInput): DueList {
  return topic ? topicList(scope, now, today, tomorrow) : dueList(scope, now, tomorrow)
}

function gradedSince(reviews: Review[], start: Date): Set<string> {
  const inSession = reviews.filter(({ reviewedAt }) => reviewedAt >= start)
  return new Set(inSession.map(({ cardId }) => cardId))
}

function introducedSince(reviews: Review[], today: Date): number {
  return reviews.filter(
    ({ reviewedAt, stateBefore }) => reviewedAt >= today && stateBefore === NEW_STATE,
  ).length
}

function heldBackOf(input: SessionInput): Set<Card> {
  if (input.topic) return new Set()
  const budget = Math.max(0, input.limits.newPerDay - introducedSince(input.reviews, input.today))
  const fresh = input.scope.filter((card) => card.state === NEW_STATE).toSorted(bySaved)
  return new Set(fresh.slice(budget))
}

function earlier(a: Date | null, b: Date): Date {
  return a !== null && a < b ? a : b
}

export function sessionList(input: SessionInput): SessionList {
  const heldBack = heldBackOf(input)
  const scope = input.scope.filter((card) => !heldBack.has(card))
  const { cards, nextDue } = eligible(scope, input)
  const graded = gradedSince(input.reviews, input.start)
  const wasGraded = (card: Card) => graded.has(card.id)
  const reShows = cards.filter(wasGraded)
  const ungraded = cards.filter((card) => !wasGraded(card))
  const places = Math.max(0, input.limits.sessionSize - graded.size)
  const filled = ungraded.slice(0, places)
  return {
    cards: [...reShows, ...filled],
    remaining: ungraded.length - filled.length,
    heldBack: heldBack.size,
    capReached: graded.size >= input.limits.sessionSize,
    nextDue: heldBack.size > 0 ? earlier(nextDue, input.tomorrow) : nextDue,
  }
}
