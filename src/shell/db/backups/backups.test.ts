import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { closeStore, openStore } from '../database/database.ts'
import { backupStore } from './backups.ts'

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

describe('backupStore', () => {
  it('000-US3-AS1 the copy opens as a store with the same content', async () => {
    const db = openStore(join(tempDir('aletheia-store-'), 'store.sqlite'))
    db.exec('create table notes (id integer primary key, body text)')
    db.exec("insert into notes (body) values ('first'), ('second')")
    const root = tempDir('aletheia-icloud-')

    const { path } = await backupStore({
      db,
      env: 'custom',
      root,
      now: new Date('2026-11-08T21:04:05.123Z'),
    })

    const folder = join(root, 'aletheia-backups')
    expect(path).toBe(join(folder, 'custom-2026-11-08T21-04-05-123Z.sqlite'))
    const copy = openStore(path)
    expect(copy.prepare('select * from notes order by id').all()).toEqual(
      db.prepare('select * from notes order by id').all(),
    )
    expect(readdirSync(folder)).toEqual(['custom-2026-11-08T21-04-05-123Z.sqlite'])
    closeStore(copy)
    closeStore(db)
  })
})
