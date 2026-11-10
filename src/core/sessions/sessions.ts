import { bySaved, NEW_STATE, type Card } from '#core/cards'
import { dueList, topicList, type DueList, type Review } from '#core/reviews'
import type { Settings } from '#core/settings'
import { PERCENT } from './sessions.constants.ts'
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

function sharePlaces(size: number, share: number): Set<number> {
  const count = Math.ceil((size * share) / PERCENT)
  const places = Array.from({ length: count }, (_, index) =>
    Math.ceil(((index + 1) * size) / count),
  )
  return new Set(places)
}

function fill(eligible: Card[], firstPlace: number, { sessionSize, newShare }: Settings): Card[] {
  const shared = sharePlaces(sessionSize, newShare)
  const left = new Set(eligible)
  const filled: Card[] = []
  const nextOf = (cards: Card[]) => cards.find((card) => left.has(card))
  const fresh = eligible.filter((card) => card.state === NEW_STATE)
  for (let place = firstPlace; place <= sessionSize; place++) {
    const next = (shared.has(place) ? nextOf(fresh) : undefined) ?? nextOf(eligible)
    if (next === undefined) break
    left.delete(next)
    filled.push(next)
  }
  return filled
}

export function sessionList(input: SessionInput): SessionList {
  const heldBack = heldBackOf(input)
  const scope = input.scope.filter((card) => !heldBack.has(card))
  const { cards, nextDue } = eligible(scope, input)
  const graded = gradedSince(input.reviews, input.start)
  const wasGraded = (card: Card) => graded.has(card.id)
  const reShows = cards.filter(wasGraded)
  const ungraded = cards.filter((card) => !wasGraded(card))
  const filled = fill(ungraded, graded.size + 1, input.limits)
  return {
    cards: [...reShows, ...filled],
    remaining: ungraded.length - filled.length,
    heldBack: heldBack.size,
    capReached: graded.size >= input.limits.sessionSize,
    nextDue: heldBack.size > 0 ? earlier(nextDue, input.tomorrow) : nextDue,
  }
}
