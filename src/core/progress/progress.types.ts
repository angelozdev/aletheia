import type { Card } from '#core/cards'
import type { Review } from '#core/reviews'

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

type TagProgress = { tag: string } & ProgressCounts

export type ProgressTree = { deck: ProgressCounts; tags: TagProgress[] }

export type CardFacts = {
  isNew: boolean
  isDue: boolean
  counted: number
  passed: number
  failures: number
  gaps: number
}
