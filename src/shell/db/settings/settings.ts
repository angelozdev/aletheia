import { eq } from 'drizzle-orm'
import type { SettingsRepository, StoredSettings } from '#core/settings'
import { database } from '../database/database.ts'
import type { Database, Store } from '../database/database.types.ts'
import { SETTINGS_ROW } from './settings.constants.ts'
import { settings } from './settings.schema.ts'

const NOTHING_STORED: StoredSettings = { sessionSize: null, newPerDay: null, newShare: null }

export class StoreSettingsRepository implements SettingsRepository {
  readonly #db: Database

  constructor(store: Store) {
    this.#db = database(store)
  }

  stored(): StoredSettings {
    const row = this.#db.select().from(settings).where(eq(settings.id, SETTINGS_ROW)).get()
    if (row === undefined) return NOTHING_STORED
    const { id: _id, ...stored } = row
    return stored
  }

  save(changes: Partial<StoredSettings>): StoredSettings {
    this.#db
      .insert(settings)
      .values({ id: SETTINGS_ROW, ...changes })
      .onConflictDoUpdate({ target: settings.id, set: changes })
      .run()
    return this.stored()
  }
}
