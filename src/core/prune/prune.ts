import { activeCardById, bySaved, type Card } from '#core/cards'
import { isFailure, NOT_USEFUL, type Review } from '#core/reviews'
import { topicCards } from '#core/tags'
import { LEECH } from './prune.constants.ts'
import type {
  Candidate,
  CandidateReason,
  Keep,
  KeepCardDeps,
  KeepDraft,
  PruneInput,
} from './prune.types.ts'

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
  const notUseful = latestOf(reviews.filter(({ flag }) => flag === NOT_USEFUL))
  const reasons: CandidateReason[] = []
  if (failures.length >= input.leechFailures) reasons.push(LEECH)
  if (notUseful !== null) reasons.push(NOT_USEFUL)
  return {
    card,
    reasons,
    failures: failures.length,
    lastFailure: latestOf(failures)?.reviewedAt ?? null,
    notUseful:
      notUseful === null ? null : { at: notUseful.reviewedAt, rationale: notUseful.rationale },
  }
}

export function candidates(input: PruneInput): Candidate[] {
  const byCard = Map.groupBy(input.reviews, ({ cardId }) => cardId)
  return inScope(input)
    .toSorted(bySaved)
    .map((card) => candidateOf(card, byCard.get(card.id) ?? [], input))
    .filter(({ reasons }) => reasons.length > 0)
}

export function keepCard(draft: KeepDraft, { cards, keeps, now }: KeepCardDeps): Keep {
  activeCardById(cards, draft.card)
  if (draft.overlaps !== null) activeCardById(cards, draft.overlaps)
  const keep = { ...draft, keptAt: now }
  keeps.save(keep)
  return keep
}
