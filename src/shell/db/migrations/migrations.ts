import { sql } from 'drizzle-orm'
import { readMigrationFiles } from 'drizzle-orm/migrator'
import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import type { Database } from '../database/database.types.ts'
import { MIGRATIONS_TABLE } from './migrations.constants.ts'
import type { AppliedMigration } from './migrations.types.ts'

function hasMigrationsTable(db: Database): boolean {
  return (
    db.all(sql`select 1 from sqlite_master where type = 'table' and name = ${MIGRATIONS_TABLE}`)
      .length > 0
  )
}

function appliedMigrations(db: Database): Set<string> {
  if (!hasMigrationsTable(db)) return new Set()
  const rows = db.all<AppliedMigration>(sql`select name from ${sql.identifier(MIGRATIONS_TABLE)}`)
  return new Set(rows.map(({ name }) => name))
}

export function pendingMigrations(db: Database, migrationsDir: string): string[] {
  const applied = appliedMigrations(db)
  return readMigrationFiles({ migrationsFolder: migrationsDir })
    .map(({ name }) => name)
    .filter((name) => !applied.has(name))
}

export function applyMigrations(db: Database, migrationsDir: string): void {
  migrate(db, { migrationsFolder: migrationsDir, migrationsTable: MIGRATIONS_TABLE })
}
