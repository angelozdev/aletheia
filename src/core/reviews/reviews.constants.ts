import type { Card, CardState } from '#core/cards'
import { scheduleAfter } from '#core/scheduling'
import type { FlagPolicy, ReviewFlag } from './reviews.types.ts'

export const LEARNING_STATES: readonly CardState[] = ['learning', 'relearning']

export const REVIEW_STATE: CardState = 'review'

export const LEARN_AHEAD_MINUTES = 20

export const REVIEW_FLAGS = [
  'missing-prerequisite',
  'badly-written',
  'badly-rephrased',
  'not-useful',
] as const

export const MISSING_PREREQUISITE = 'missing-prerequisite'

const BADLY_WRITTEN = 'badly-written'

const BADLY_REPHRASED = 'badly-rephrased'

export const NOT_USEFUL = 'not-useful'

export const NO_FLAG: FlagPolicy = {
  schedule: scheduleAfter,
  hidesUntilTomorrow: false,
  countsAsIntroduced: true,
  countsInStats: true,
}

const KEEP_SCHEDULE = (card: Card) => card

const VOIDED: FlagPolicy = {
  schedule: KEEP_SCHEDULE,
  hidesUntilTomorrow: true,
  countsAsIntroduced: false,
  countsInStats: false,
}

export const FLAG_POLICIES: Record<ReviewFlag, FlagPolicy> = {
  [MISSING_PREREQUISITE]: NO_FLAG,
  [BADLY_WRITTEN]: VOIDED,
  [BADLY_REPHRASED]: VOIDED,
  [NOT_USEFUL]: NO_FLAG,
}
