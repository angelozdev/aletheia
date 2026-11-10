import type { cards, cardTags } from './cards.schema.ts'

export type CardRow = typeof cards.$inferInsert

export type ScheduleRow = Pick<
  CardRow,
  | 'due'
  | 'state'
  | 'stability'
  | 'difficulty'
  | 'scheduledDays'
  | 'learningSteps'
  | 'reps'
  | 'lapses'
  | 'lastReview'
>

export type ContentRow = Pick<
  CardRow,
  'type' | 'question' | 'answer' | 'situation' | 'keyPoints' | 'updatedAt'
>

export type TagRow = typeof cardTags.$inferInsert

export type StoredCard = typeof cards.$inferSelect
