import type { Keep, KeepRepository } from '#core/prune'
import { storedInstant } from '#core/time'
import { database } from '../database/database.ts'
import type { Database, Store } from '../database/database.types.ts'
import { keeps } from './keeps.schema.ts'

export class StoreKeepRepository implements KeepRepository {
  readonly #db: Database

  constructor(store: Store) {
    this.#db = database(store)
  }

  save({ card, reason, overlaps, keptAt }: Keep): void {
    this.#db
      .insert(keeps)
      .values({ cardId: card, reason, overlaps, keptAt: storedInstant(keptAt) })
      .run()
  }
}
