import { activeCardById, bySaved, type Card } from '#core/cards'
import { isFailure, NOT_USEFUL, type Review } from '#core/reviews'
import { topicCards } from '#core/tags'
import { CANDIDATE_REASONS, LEECH } from './prune.constants.ts'
import { NotACandidateError } from './prune.errors.ts'
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
  const active = new Set(input.cards.map(({ id }) => id))
  const scope = new Set(inScope(input).map(({ id }) => id))
  const ofActive = ({ card, overlaps }: Keep) =>
    active.has(card) && (overlaps === null || active.has(overlaps))
  const inScopeKeep = ({ card, overlaps }: Keep) =>
    scope.has(card) || (overlaps !== null && scope.has(overlaps))
  return input.keeps
    .filter((keep) => ofActive(keep) && inScopeKeep(keep) && keep.keptAt >= input.keepStart)
    .toReversed()
    .toSorted(newestFirst)
}

function isCandidateReason(reason: KeepReason): reason is CandidateReason {
  return CANDIDATE_REASONS.some((candidate) => candidate === reason)
}

function checkCandidate(card: Card, reason: KeepReason, evidence: PruneInput): void {
  if (!isCandidateReason(reason)) return
  const reviews = evidence.reviews.filter(({ cardId }) => cardId === card.id)
  const keeps = evidence.keeps.filter((keep) => keep.card === card.id)
  const { reasons } = candidateOf(card, reviews, keeps, evidence)
  if (!reasons.includes(reason)) throw new NotACandidateError(card.id, reason)
}

export function keepCard(draft: KeepDraft, { cards, keeps, now, evidence }: KeepCardDeps): Keep {
  const card = activeCardById(cards, draft.card)
  if (draft.overlaps !== null) activeCardById(cards, draft.overlaps)
  checkCandidate(card, draft.reason, evidence)
  const keep = { ...draft, keptAt: now }
  keeps.save(keep)
  return keep
}
