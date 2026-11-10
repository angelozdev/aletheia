import type { reviews } from './reviews.schema.ts'

export type ReviewRow = typeof reviews.$inferInsert
