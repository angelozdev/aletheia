import type { Card, CardState } from '#core/cards'
import { scheduleAfter } from '#core/scheduling'
import type { FlagPolicy, ReviewFlag } from './reviews.types.ts'

export const LEARNING_STATES: readonly CardState[] = ['learning', 'relearning']

export const REVIEW_STATE: CardState = 'review'

export const LEARN_AHEAD_MINUTES = 20

export const REVIEW_FLAGS = ['missing-prerequisite', 'badly-written'] as const

export const MISSING_PREREQUISITE = 'missing-prerequisite'

const BADLY_WRITTEN = 'badly-written'

export const NO_FLAG: FlagPolicy = {
  schedule: scheduleAfter,
  hidesUntilTomorrow: false,
  countsAsIntroduced: true,
}

const KEEP_SCHEDULE = (card: Card) => card

export const FLAG_POLICIES: Record<ReviewFlag, FlagPolicy> = {
  [MISSING_PREREQUISITE]: NO_FLAG,
  [BADLY_WRITTEN]: {
    schedule: KEEP_SCHEDULE,
    hidesUntilTomorrow: true,
    countsAsIntroduced: false,
  },
}
