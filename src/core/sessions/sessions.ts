import { bySaved, NEW_STATE, type Card } from '#core/cards'
import { dueList, policyOf, topicList, type DueList, type Review } from '#core/reviews'
import type { Settings } from '#core/settings'
import { PERCENT } from './sessions.constants.ts'
import type { SessionInput, SessionList } from './sessions.types.ts'

function eligible(scope: Card[], { topic, now, today, tomorrow }: SessionInput): DueList {
  return topic ? topicList(scope, now, today, tomorrow) : dueList(scope, now, tomorrow)
}

function reviewsSince(reviews: Review[], start: Date): Review[] {
  return reviews.filter(({ reviewedAt }) => reviewedAt >= start)
}

function gradedSince(reviews: Review[], start: Date): Set<string> {
  const inSession = reviewsSince(reviews, start)
  return new Set(inSession.map(({ cardId }) => cardId))
}

function countedSince(reviews: Review[], start: Date): number {
  const byCard = Map.groupBy(reviewsSince(reviews, start), ({ cardId }) => cardId)
  return [...byCard.values()].filter(([first]) => first.prerequisiteOf === null).length
}

function introducedSince(reviews: Review[], today: Date): number {
  return reviewsSince(reviews, today).filter(
    ({ stateBefore, prerequisiteOf }) => stateBefore === NEW_STATE && prerequisiteOf === null,
  ).length
}

function hiddenOf({ scope, reviews, today }: SessionInput): Set<Card> {
  const hiding = reviewsSince(reviews, today).filter(
    ({ flag }) => policyOf(flag).hidesUntilTomorrow,
  )
  const hidingIds = new Set(hiding.map(({ cardId }) => cardId))
  return new Set(scope.filter((card) => hidingIds.has(card.id)))
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
  const hidden = hiddenOf(input)
  const visible = input.scope.filter((card) => !hidden.has(card))
  const heldBack = heldBackOf({ ...input, scope: visible })
  const scope = visible.filter((card) => !heldBack.has(card))
  const { cards, nextDue } = eligible(scope, input)
  const graded = gradedSince(input.reviews, input.start)
  const counted = countedSince(input.reviews, input.start)
  const wasGraded = (card: Card) => graded.has(card.id)
  const reShows = cards.filter(wasGraded)
  const ungraded = cards.filter((card) => !wasGraded(card))
  const filled = fill(ungraded, counted + 1, input.limits)
  return {
    cards: [...reShows, ...filled],
    remaining: ungraded.length - filled.length,
    heldBack: heldBack.size,
    capReached: counted >= input.limits.sessionSize,
    nextDue: heldBack.size + hidden.size > 0 ? earlier(nextDue, input.tomorrow) : nextDue,
  }
}
