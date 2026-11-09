import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { openTestStore } from '../../../../tests/support/store/store.ts'
import { closeStore } from '../database/database.ts'
import type { Store } from '../database/database.types.ts'
import { backupStore } from './backups.ts'

let lockedFolder: string | null = null

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function tempStore(): Store {
  return openTestStore(join(tempDir('aletheia-store-'), 'store.sqlite'))
}

afterEach(() => {
  if (lockedFolder !== null) chmodSync(lockedFolder, 0o700)
  lockedFolder = null
})

describe('backupStore', () => {
  it('000-US3-AS1 the copy opens as a store with the same content', async () => {
    const db = tempStore()
    db.$client.exec('create table notes (id integer primary key, body text)')
    db.$client.exec("insert into notes (body) values ('first'), ('second')")
    const root = tempDir('aletheia-data-')

    const { path } = await backupStore({
      db,
      env: 'custom',
      root,
      now: new Date('2026-11-08T21:04:05.123Z'),
    })

    const folder = join(root, 'backups')
    expect(path).toBe(join(folder, 'custom-2026-11-08T21-04-05-123Z.sqlite'))
    const copy = openTestStore(path)
    expect(copy.$client.prepare('select * from notes order by id').all()).toEqual(
      db.$client.prepare('select * from notes order by id').all(),
    )
    expect(readdirSync(folder)).toEqual(['custom-2026-11-08T21-04-05-123Z.sqlite'])
    closeStore(copy)
    closeStore(db)
  })

  it("000-US3-AS2 a sixth backup removes that env's oldest copy only", async () => {
    const db = tempStore()
    const root = tempDir('aletheia-data-')
    const folder = join(root, 'backups')
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

  it('000-US3-AS3 a copy that cannot be moved into place leaves no .partial', async () => {
    const db = tempStore()
    const root = tempDir('aletheia-data-')
    const folder = join(root, 'backups')
    const blocker = 'custom-2026-11-08T21-04-05-123Z.sqlite'
    mkdirSync(join(folder, blocker), { recursive: true })

    await expect(
      backupStore({ db, env: 'custom', root, now: new Date('2026-11-08T21:04:05.123Z') }),
    ).rejects.toThrow(new RegExp(`^${RegExp.escape(`cannot write backup to ${folder}: `)}.+`))
    expect(readdirSync(folder)).toEqual([blocker])
    closeStore(db)
  })

  it('000-US3-AS3 a backup folder that cannot be created is named in the refusal', async () => {
    const db = tempStore()
    const root = tempDir('aletheia-data-')
    chmodSync(root, 0o500)
    lockedFolder = root

    await expect(
      backupStore({ db, env: 'custom', root, now: new Date('2026-11-08T21:04:05.123Z') }),
    ).rejects.toThrow(
      new RegExp(`^${RegExp.escape(`cannot write backup to ${join(root, 'backups')}: `)}.+`),
    )
    expect(readdirSync(root)).toEqual([])
    closeStore(db)
  })
})
