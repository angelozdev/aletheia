import type { Card } from '#core/cards'
import type { Review, ReviewFlag } from '#core/reviews'
import type { Grade } from '#core/scheduling'
import type { CARD_SORT_FIELDS, TAG_SORT_FIELDS } from './progress.constants.ts'

export type ProgressInput = {
  cards: Card[]
  topic: string[]
  reviews: Review[]
  today: Date
  tomorrow: Date
  windowStart: Date
}

export type ProgressCounts = {
  cards: number
  new: number
  due: number
  retention: number | null
  weak: number
  gaps: number
}

export type TagProgress = { tag: string } & ProgressCounts

export type ProgressTree = { deck: ProgressCounts; tags: TagProgress[] }

export type CardFacts = {
  isNew: boolean
  isDue: boolean
  counted: number
  passed: number
  failures: number
  gaps: number
  lastReview: Date | null
}

type TagSortField = (typeof TAG_SORT_FIELDS)[number]

export type TagOrder = { field: TagSortField; desc: boolean }

export type SortValue = string | number | Date | null

export type Comparator<Row> = (a: Row, b: Row) => number

export type CardProgress = {
  card: Card
  failures: number
  gaps: number
  weak: boolean
  lastReview: Date | null
}

export type CardFilters = { weak?: boolean; gaps?: boolean; notReviewed?: Date }

export type CardSortField = (typeof CARD_SORT_FIELDS)[number]

export type CardOrder = { field: CardSortField; desc: boolean }

export type HistoryEntry = {
  card: string
  reviewedAt: Date
  grade: Grade
  claudeGrade: Grade
  flag: ReviewFlag | null
  askedQuestion: string | null
}

export type HistoryCounts = {
  reviews: number
  grades: Record<string, number>
  flags: Record<string, number>
  disputed: number
}

export type ReviewHistory = { counts: HistoryCounts; reviews: HistoryEntry[] }

export type HistoryFilters = { grade?: Grade; flag?: ReviewFlag }
