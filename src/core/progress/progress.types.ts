import type { Card } from '#core/cards'
import type { Review } from '#core/reviews'
import type { TAG_SORT_FIELDS } from './progress.constants.ts'

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
}

type TagSortField = (typeof TAG_SORT_FIELDS)[number]

export type TagOrder = { field: TagSortField; desc: boolean }

export type SortValue = string | number | null

export type Comparator<Row> = (a: Row, b: Row) => number
