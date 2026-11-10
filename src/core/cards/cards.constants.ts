export const CARD_TYPES = ['concept', 'comparison', 'command', 'scenario', 'code'] as const

export const CARD_STATUSES = ['active', 'archived'] as const

export const CARD_STATES = ['new', 'learning', 'review', 'relearning'] as const

export const ACTIVE_STATUS = 'active'

export const NEW_STATE = 'new'

export const ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'

export const ID_LENGTH = 4

export const MIN_KEY_POINTS = 1

export const MAX_KEY_POINTS = 3

export const TAG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*(::[a-z0-9]+(-[a-z0-9]+)*)*$/
