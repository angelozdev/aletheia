import { bySaved, type Card } from '#core/cards'
import { isFailure, type Review } from '#core/reviews'
import { topicCards } from '#core/tags'
import { LEECH } from './prune.constants.ts'
import type { Candidate, PruneInput } from './prune.types.ts'

function inScope({ cards, topic }: PruneInput): Card[] {
  return topic.length === 0 ? cards : topicCards(cards, topic)
}

function latestOf(reviews: Review[]): Review | null {
  return reviews.reduce<Review | null>(
    (last, review) => (last === null || review.reviewedAt > last.reviewedAt ? review : last),
    null,
  )
}

function candidateOf(card: Card, reviews: Review[], input: PruneInput): Candidate {
  const failures = reviews.filter(isFailure)
  return {
    card,
    reasons: failures.length >= input.leechFailures ? [LEECH] : [],
    failures: failures.length,
    lastFailure: latestOf(failures)?.reviewedAt ?? null,
  }
}

export function candidates(input: PruneInput): Candidate[] {
  const byCard = Map.groupBy(input.reviews, ({ cardId }) => cardId)
  return inScope(input)
    .toSorted(bySaved)
    .map((card) => candidateOf(card, byCard.get(card.id) ?? [], input))
    .filter(({ reasons }) => reasons.length > 0)
}
