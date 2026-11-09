import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import type { Store } from '../database/database.types.ts'
import { MIGRATIONS_TABLE } from './migrations.constants.ts'
import type { AppliedMigration } from './migrations.types.ts'

function hasMigrationsTable(store: Store): boolean {
  return (
    store.all(sql`select 1 from sqlite_master where type = 'table' and name = ${MIGRATIONS_TABLE}`)
      .length > 0
  )
}

function appliedMigrations(store: Store): Set<string> {
  if (!hasMigrationsTable(store)) return new Set()
  const rows = store.all<AppliedMigration>(
    sql`select name from ${sql.identifier(MIGRATIONS_TABLE)}`,
  )
  return new Set(rows.map(({ name }) => name))
}

export function pendingMigrations(store: Store, migrationsDir: string): string[] {
  const applied = appliedMigrations(store)
  return readMigrationFiles({ migrationsFolder: migrationsDir })
    .map(({ name }) => name)
    .filter((name) => !applied.has(name))
}

export function applyMigrations(store: Store, migrationsDir: string): void {
  migrate(store, { migrationsFolder: migrationsDir, migrationsTable: MIGRATIONS_TABLE })
}
