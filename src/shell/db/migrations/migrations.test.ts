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
import { openTestStore, selectAll } from '../../../../tests/support/store/store.ts'
import { closeStore } from '../database/database.ts'

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

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
