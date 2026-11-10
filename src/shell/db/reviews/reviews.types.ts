import type { reviews } from './reviews.schema.ts'

export type ReviewRow = typeof reviews.$inferInsert

export type StoredReview = typeof reviews.$inferSelect
