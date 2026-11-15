import type { Card } from '#core/cards'
import type { Review } from '#core/reviews'
import type { CANDIDATE_REASONS } from './prune.constants.ts'

export type CandidateReason = (typeof CANDIDATE_REASONS)[number]

type NotUseful = { at: Date; rationale: string }

export type PruneInput = {
  cards: Card[]
  topic: string[]
  reviews: Review[]
  leechFailures: number
}

export type Candidate = {
  card: Card
  reasons: CandidateReason[]
  failures: number
  lastFailure: Date | null
  notUseful: NotUseful | null
}
