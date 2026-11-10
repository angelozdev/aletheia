import type { CARD_STATES, CARD_STATUSES, CARD_TYPES } from './cards.constants.ts'

export type CardType = (typeof CARD_TYPES)[number]

export type CardStatus = (typeof CARD_STATUSES)[number]

export type CardState = (typeof CARD_STATES)[number]

export type CardDraft = {
  type: CardType
  question: string
  answer: string
  keyPoints: string[]
  situation: string
  tags: string[]
  source: string
}

export type Card = CardDraft & {
  id: string
  status: CardStatus
  state: CardState
  due: Date
  stability: number
  difficulty: number
  scheduledDays: number
  learningSteps: number
  reps: number
  lapses: number
  lastReview: Date | null
  createdAt: Date
  updatedAt: Date
}

export type RandomIndex = (bound: number) => number

export interface CardRepository {
  saveAll(cards: Card[]): void
  find(id: string): Card | null
}

export type AddCardsDeps = {
  repository: CardRepository
  randomIndex: RandomIndex
  now: Date
}
