import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { applyMigrations, pendingMigrations } from '../migrations/migrations.ts'
import type { Store, StoreRequest } from './database.types.ts'

export function openStore({ path, migrationsDir, onMigrated }: StoreRequest): Store {
  const store = drizzle({ client: new DatabaseSync(path) })
  const pending = pendingMigrations(store, migrationsDir)
  applyMigrations(store, migrationsDir)
  for (const name of pending) onMigrated(name)
  return store
}

export function closeStore(store: Store): void {
  store.$client.close()
}
