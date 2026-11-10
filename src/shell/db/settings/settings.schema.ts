import { sql } from 'drizzle-orm'
import { check, integer, sqliteTable } from 'drizzle-orm/sqlite-core'

export const settings = sqliteTable(
  'settings',
  {
    id: integer().primaryKey(),
    sessionSize: integer('session_size'),
    newPerDay: integer('new_per_day'),
    newShare: integer('new_share'),
  },
  (table) => [
    check('settings_single_row', sql`${table.id} = 1`),
    check('settings_session_size', sql`${table.sessionSize} IS NULL OR ${table.sessionSize} >= 1`),
    check('settings_new_per_day', sql`${table.newPerDay} IS NULL OR ${table.newPerDay} >= 0`),
    check(
      'settings_new_share',
      sql`${table.newShare} IS NULL OR ${table.newShare} BETWEEN 0 AND 100`,
    ),
  ],
)
