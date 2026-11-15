import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tempDir } from '../temp-dir/temp-dir.ts'
import { MIGRATION_FILE, SHIPPED_MIGRATIONS } from './fixture-migrations.constants.ts'
import type { FixtureMigrations } from './fixture-migrations.types.ts'

export function writeMigrations(dir: string, migrations: FixtureMigrations): string {
  for (const [name, sql] of Object.entries(migrations)) {
    mkdirSync(join(dir, name), { recursive: true })
    writeFileSync(join(dir, name, MIGRATION_FILE), sql)
  }
  return dir
}

export function noMigrations(): string {
  return tempDir('aletheia-migrations-')
}

export function migrationsUpTo(last: string): string {
  const dir = noMigrations()
  const names = readdirSync(SHIPPED_MIGRATIONS).filter((name) => name <= last)
  for (const name of names)
    cpSync(join(SHIPPED_MIGRATIONS, name), join(dir, name), { recursive: true })
  return dir
}
