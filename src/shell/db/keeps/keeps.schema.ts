import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { KEEP_REASONS, OVERLAPPING, type KeepReason } from '#core/prune'
import { cards } from '../cards/cards.schema.ts'
import { oneOf, textLiteral } from '../checks/checks.ts'

export const keeps = sqliteTable(
  'keeps',
  {
    id: integer().primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    reason: text().$type<KeepReason>().notNull(),
    overlaps: text().references(() => cards.id),
    keptAt: text('kept_at').notNull(),
  },
  (table) => [
    check('keeps_reason', oneOf(table.reason, KEEP_REASONS)),
    check(
      'keeps_overlaps',
      sql`(${table.reason} = ${textLiteral(OVERLAPPING)}) = (${table.overlaps} IS NOT NULL)`,
    ),
    check(
      'keeps_overlaps_other',
      sql`${table.overlaps} IS NULL OR ${table.overlaps} <> ${table.cardId}`,
    ),
  ],
)
