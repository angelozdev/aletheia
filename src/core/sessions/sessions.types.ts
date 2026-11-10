import type { Card } from '#core/cards'
import type { Review } from '#core/reviews'
import type { Settings } from '#core/settings'

export type SessionInput = {
  scope: Card[]
  topic: boolean
  reviews: Review[]
  now: Date
  today: Date
  tomorrow: Date
  start: Date
  limits: Settings
}

export type SessionList = {
  cards: Card[]
  remaining: number
  heldBack: number
  capReached: boolean
  nextDue: Date | null
}
