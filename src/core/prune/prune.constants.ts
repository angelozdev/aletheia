import { NOT_USEFUL } from '#core/reviews'

export const LEECH = 'leech'

export const OVERLAPPING = 'overlapping'

const OUTDATED_SITUATION = 'outdated-situation'

export const CANDIDATE_REASONS = [LEECH, NOT_USEFUL] as const

export const KEEP_REASONS = [LEECH, NOT_USEFUL, OUTDATED_SITUATION, OVERLAPPING] as const
