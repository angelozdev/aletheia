import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  insertSql,
  openTestStore,
  runSql,
  selectAll,
} from '../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'
import { closeStore } from '../database/database.ts'
import { StoreSettingsRepository } from './settings.ts'

let path: string

beforeEach(async () => {
  path = join(tempDir('aletheia-store-'), 'store.sqlite')
  closeStore(await openTestStore(path))
})

describe('StoreSettingsRepository', () => {
  it('stored reads every setting as null with no row', async () => {
    const store = await openTestStore(path)
    try {
      expect(new StoreSettingsRepository(store).stored()).toEqual({
        sessionSize: null,
        newPerDay: null,
        newShare: null,
      })
    } finally {
      closeStore(store)
    }
  })
})

describe('the settings table', () => {
  it.for<[string, Record<string, string>]>([
    ['a second settings row', { id: '2' }],
    ['a session size below 1', { id: '1', session_size: '0' }],
    ['new cards per day below 0', { id: '1', new_per_day: '-1' }],
    ['a share above 100', { id: '1', new_share: '101' }],
    ['a share below 0', { id: '1', new_share: '-1' }],
  ])('the store refuses a second settings row and every value out of range: %s', ([, row]) => {
    expect(() => runSql(path, insertSql('settings', row))).toThrow()
    expect(selectAll(path, 'select count(*) as n from settings')).toEqual([{ n: 0 }])
  })
})
