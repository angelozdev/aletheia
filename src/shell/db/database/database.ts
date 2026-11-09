import { DatabaseSync } from 'node:sqlite'
import type { Store } from './database.types.ts'

export function openStore(path: string): Store {
  return new DatabaseSync(path)
}

export function closeStore(store: Store): void {
  store.close()
}
