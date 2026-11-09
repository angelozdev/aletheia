import { existsSync, mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FIXTURE_MIGRATIONS,
  MIGRATION_FILE,
  SHIPPED_MIGRATIONS,
} from '../../../../tests/support/fixture-migrations/fixture-migrations.constants.ts'
import { writeMigrations } from '../../../../tests/support/fixture-migrations/fixture-migrations.ts'
import { openTestStore } from '../../../../tests/support/store/store.ts'
import { closeStore } from '../database/database.ts'
import type { Store } from '../database/database.types.ts'

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function newStore(migrationsDir: string): Store {
  return openTestStore(join(tempDir('aletheia-store-'), 'store.sqlite'), migrationsDir)
}

function firstColumn(store: Store, query: string): unknown[] {
  return store.$client
    .prepare(query)
    .all()
    .map((row) => Object.values(row)[0])
}

describe('migrations', () => {
  it('000-US4-AS1 a new store is created with every migration applied', () => {
    const store = newStore(writeMigrations(tempDir('aletheia-migrations-'), FIXTURE_MIGRATIONS))

    expect(
      firstColumn(
        store,
        "select name from sqlite_master where type = 'table' and name like 'fixture_%' order by name",
      ),
    ).toEqual(['fixture_a', 'fixture_b'])
    expect(firstColumn(store, 'select name from __drizzle_migrations order by id')).toEqual([
      '20261108000000_first',
      '20261108000100_second',
    ])
    closeStore(store)
  })

  it('the shipped migrations folder opens a store with every shipped migration applied', () => {
    const shipped = readdirSync(SHIPPED_MIGRATIONS)
      .filter((name) => existsSync(join(SHIPPED_MIGRATIONS, name, MIGRATION_FILE)))
      .toSorted()

    const store = newStore(SHIPPED_MIGRATIONS)

    expect(firstColumn(store, 'select name from __drizzle_migrations order by name')).toEqual(
      shipped,
    )
    closeStore(store)
  })
})
