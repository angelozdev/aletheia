import type { TagOrder } from './progress.types.ts'

export const EVER = new Date(0)

export const PROGRESS_WINDOW_DAYS = 30

export const PERCENT = 100

export const WEAK_FAILURES = 4

export const TAG_SORT_FIELDS = ['tag', 'cards', 'new', 'due', 'retention', 'weak', 'gaps'] as const

export const TAG_FIELD = 'tag'

export const DEFAULT_TAG_ORDER: TagOrder = { field: TAG_FIELD, desc: false }
