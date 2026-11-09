import { migrate } from 'drizzle-orm/node-sqlite/migrator'
import type { Store } from '../database/database.types.ts'

export function applyMigrations(store: Store, migrationsDir: string): void {
  migrate(store, { migrationsFolder: migrationsDir })
}
