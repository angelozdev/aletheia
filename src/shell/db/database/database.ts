import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/node-sqlite'
import { applyMigrations } from '../migrations/migrations.ts'
import type { Store, StoreRequest } from './database.types.ts'

export function openStore({ path, migrationsDir }: StoreRequest): Store {
  const store = drizzle({ client: new DatabaseSync(path) })
  applyMigrations(store, migrationsDir)
  return store
}

export function closeStore(store: Store): void {
  store.$client.close()
}
