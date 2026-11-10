import type { cards } from './cards.schema.ts'

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

export type StoredCard = typeof cards.$inferSelect
