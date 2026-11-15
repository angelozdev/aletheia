import type { CardOrder, TagOrder } from './progress.types.ts'

export const EVER = new Date(0)

export const PROGRESS_WINDOW_DAYS = 30

export const PERCENT = 100

export const WEAK_FAILURES = 3

export const TAG_SORT_FIELDS = ['tag', 'cards', 'new', 'due', 'retention', 'weak', 'gaps'] as const

export const TAG_FIELD = 'tag'

export const DEFAULT_TAG_ORDER: TagOrder = { field: TAG_FIELD, desc: false }

export const CARD_SORT_FIELDS = ['id', 'state', 'due', 'lastReview', 'failures', 'gaps'] as const

export const DEFAULT_CARD_ORDER: CardOrder = { field: 'lastReview', desc: false }
