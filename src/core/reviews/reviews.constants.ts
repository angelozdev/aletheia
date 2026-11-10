import type { CardState } from '#core/cards'

export const LEARNING_STATES: readonly CardState[] = ['learning', 'relearning']

export const REVIEW_STATE: CardState = 'review'

export const LEARN_AHEAD_MINUTES = 20

export const REVIEW_FLAGS = ['missing-prerequisite', 'badly-written'] as const

export const MISSING_PREREQUISITE = 'missing-prerequisite'
