import { MAX_KEY_POINTS, MIN_KEY_POINTS } from '#core/cards'

export const REQUIRED = 'is required'

export const KEY_POINTS_COUNT = `must have ${MIN_KEY_POINTS} to ${MAX_KEY_POINTS} items`

export const NO_TAGS = 'must have at least one tag'

export const MALFORMED_TAG = 'use a-z, digits and dashes, in segments joined by ::'

export const REPEATED = 'is repeated'

export const NOT_A_CARD_FIELD = 'is not a card field'

export const FIELD_SEPARATOR = '; '

export const CARD_SEPARATOR = ' | '

export const EXPECTED_CARD_LIST = 'expected a list of one or more cards'
