import type { Card, CardRepository } from '#core/cards'
import type { Review } from '#core/reviews'
import type { CANDIDATE_REASONS, KEEP_REASONS } from './prune.constants.ts'

export type CandidateReason = (typeof CANDIDATE_REASONS)[number]

type NotUseful = { at: Date; rationale: string }

export type PruneInput = {
  cards: Card[]
  topic: string[]
  reviews: Review[]
  leechFailures: number
  keeps: Keep[]
  keepStart: Date
}

export type Candidate = {
  card: Card
  reasons: CandidateReason[]
  failures: number
  lastFailure: Date | null
  notUseful: NotUseful | null
}

export type KeepReason = (typeof KEEP_REASONS)[number]

export type Keep = { card: string; reason: KeepReason; overlaps: string | null; keptAt: Date }

export type KeepDraft = Omit<Keep, 'keptAt'>

export interface KeepRepository {
  save(keep: Keep): void
  all(): Keep[]
}

export type KeepCardDeps = { cards: CardRepository; keeps: KeepRepository; now: Date }
