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
  KeepReason,
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

function latestKeep(keeps: Keep[], reason: KeepReason): Date | null {
  return keeps
    .filter((keep) => keep.reason === reason)
    .reduce<Date | null>(
      (last, { keptAt }) => (last === null || keptAt > last ? keptAt : last),
      null,
    )
}

function isLeech(failures: Review[], keeps: Keep[], input: PruneInput): boolean {
  const lastFailure = latestOf(failures)?.reviewedAt
  const kept = latestKeep(keeps, LEECH)
  const failedSinceKept = kept === null || (lastFailure !== undefined && lastFailure > kept)
  return failures.length >= input.leechFailures && failedSinceKept
}

function isNotUseful(notUseful: Review | null, keeps: Keep[], input: PruneInput): boolean {
  const kept = latestKeep(keeps, NOT_USEFUL)
  return notUseful !== null && (kept === null || kept < input.keepStart)
}

function candidateOf(card: Card, reviews: Review[], keeps: Keep[], input: PruneInput): Candidate {
  const failures = reviews.filter(isFailure)
  const notUseful = latestOf(reviews.filter(({ flag }) => flag === NOT_USEFUL))
  const reasons: CandidateReason[] = []
  if (isLeech(failures, keeps, input)) reasons.push(LEECH)
  if (isNotUseful(notUseful, keeps, input)) reasons.push(NOT_USEFUL)
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
  const reviewsByCard = Map.groupBy(input.reviews, ({ cardId }) => cardId)
  const keepsByCard = Map.groupBy(input.keeps, ({ card }) => card)
  return inScope(input)
    .toSorted(bySaved)
    .map((card) => {
      const reviews = reviewsByCard.get(card.id) ?? []
      return candidateOf(card, reviews, keepsByCard.get(card.id) ?? [], input)
    })
    .filter(({ reasons }) => reasons.length > 0)
}

function newestFirst(a: Keep, b: Keep): number {
  return b.keptAt.getTime() - a.keptAt.getTime()
}

export function kept(input: PruneInput): Keep[] {
  const scope = new Set(inScope(input).map(({ id }) => id))
  return input.keeps
    .filter(({ card, keptAt }) => scope.has(card) && keptAt >= input.keepStart)
    .toReversed()
    .toSorted(newestFirst)
}

export function keepCard(draft: KeepDraft, { cards, keeps, now }: KeepCardDeps): Keep {
  activeCardById(cards, draft.card)
  if (draft.overlaps !== null) activeCardById(cards, draft.overlaps)
  const keep = { ...draft, keptAt: now }
  keeps.save(keep)
  return keep
}
