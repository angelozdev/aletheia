import { openStore, type Store } from '#shell/db'
import { SHIPPED_MIGRATIONS } from '../fixture-migrations/fixture-migrations.constants.ts'

export function openTestStore(path: string, migrationsDir: string = SHIPPED_MIGRATIONS): Store {
  return openStore({ path, migrationsDir, onMigrated: () => {} })
}
