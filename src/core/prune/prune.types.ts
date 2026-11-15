import type { Card } from '#core/cards'
import type { Review } from '#core/reviews'
import type { CANDIDATE_REASONS } from './prune.constants.ts'

type CandidateReason = (typeof CANDIDATE_REASONS)[number]

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
}
