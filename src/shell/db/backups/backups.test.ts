import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
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

  it("000-US3-AS2 a sixth backup removes that env's oldest copy only", async () => {
    const db = openStore(join(tempDir('aletheia-store-'), 'store.sqlite'))
    const root = tempDir('aletheia-icloud-')
    const folder = join(root, 'aletheia-backups')
    const seeded = [
      'prod-2026-11-01T10-00-00-000Z.sqlite',
      'prod-2026-11-02T10-00-00-000Z.sqlite',
      'prod-2026-11-03T10-00-00-000Z.sqlite',
      'prod-2026-11-04T10-00-00-000Z.sqlite',
      'prod-2026-11-05T10-00-00-000Z.sqlite',
      'test-2026-10-01T10-00-00-000Z.sqlite',
      'test-2026-10-02T10-00-00-000Z.sqlite',
      'notes.txt',
    ]
    mkdirSync(folder)
    for (const name of seeded) writeFileSync(join(folder, name), name)

    const { removed } = await backupStore({
      db,
      env: 'prod',
      root,
      now: new Date('2026-11-08T21:04:05.123Z'),
    })

    expect(removed).toEqual([join(folder, 'prod-2026-11-01T10-00-00-000Z.sqlite')])
    expect(readdirSync(folder).toSorted()).toEqual(
      [...seeded.slice(1), 'prod-2026-11-08T21-04-05-123Z.sqlite'].toSorted(),
    )
    for (const name of seeded.slice(1)) {
      expect(readFileSync(join(folder, name), 'utf8')).toBe(name)
    }
    closeStore(db)
  })
})
