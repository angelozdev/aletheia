import type { Card } from '#core/cards'

export type DueList = { cards: Card[]; nextDue: Date | null }
