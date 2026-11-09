import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  FAILING_MIGRATIONS,
  FIXTURE_MIGRATIONS,
  MIGRATION_FILE,
  SHIPPED_MIGRATIONS,
} from '../../../../tests/support/fixture-migrations/fixture-migrations.constants.ts'
import { writeMigrations } from '../../../../tests/support/fixture-migrations/fixture-migrations.ts'
import { openTestStore, selectAll } from '../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'
import { closeStore } from '../database/database.ts'

async function newStore(migrationsDir: string): Promise<string> {
  const path = join(tempDir('aletheia-store-'), 'store.sqlite')
  closeStore(await openTestStore(path, migrationsDir))
  return path
}

function firstColumn(path: string, query: string): unknown[] {
  return selectAll(path, query).map((row) => Object.values(row)[0])
}

describe('migrations', () => {
  it('000-US4-AS1 a new store is created with every migration applied', async () => {
    const store = await newStore(
      writeMigrations(tempDir('aletheia-migrations-'), FIXTURE_MIGRATIONS),
    )

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
  })

  it('000-US4-AS4 a failing migration keeps none of the pending ones', async () => {
    const path = join(tempDir('aletheia-store-'), 'store.sqlite')
    const migrationsDir = writeMigrations(tempDir('aletheia-migrations-'), FAILING_MIGRATIONS)

    await expect(openTestStore(path, migrationsDir)).rejects.toThrow(
      /^migration 20261108000100_second failed: .+$/,
    )
    expect(
      firstColumn(
        path,
        "select name from sqlite_master where type = 'table' and name like 'fixture_%'",
      ),
    ).toEqual([])
    expect(firstColumn(path, 'select name from __drizzle_migrations')).toEqual([])
  })

  it('the shipped migrations folder opens a store with every shipped migration applied', async () => {
    const shipped = readdirSync(SHIPPED_MIGRATIONS)
      .filter((name) => existsSync(join(SHIPPED_MIGRATIONS, name, MIGRATION_FILE)))
      .toSorted()

    const store = await newStore(SHIPPED_MIGRATIONS)

    expect(firstColumn(store, 'select name from __drizzle_migrations order by name')).toEqual(
      shipped,
    )
  })
})
