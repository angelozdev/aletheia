import { createHash } from 'node:crypto'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { closeStore } from '#shell/db'
import { FIXTURE_MIGRATIONS } from '../../../../../tests/support/fixture-migrations/fixture-migrations.constants.ts'
import { writeMigrations } from '../../../../../tests/support/fixture-migrations/fixture-migrations.ts'
import { FIXED_INSTANT } from '../../../../../tests/support/run-cli/run-cli.constants.ts'
import { runCli } from '../../../../../tests/support/run-cli/run-cli.ts'
import { openTestStore } from '../../../../../tests/support/store/store.ts'

let db: string
let dataDir: string
let copy: string
let lockedFolder: string | null = null

function backup(argv: string[] = []) {
  return runCli(['backup', ...argv], { vars: { ALETHEIA_DB: db }, dataDir })
}

beforeEach(() => {
  db = join(mkdtempSync(join(tmpdir(), 'aletheia-cli-')), 'store.sqlite')
  dataDir = mkdtempSync(join(tmpdir(), 'aletheia-data-'))
  copy = join(dataDir, 'backups', 'custom-2026-11-08T21-04-05-123Z.sqlite')
})

afterEach(() => {
  if (lockedFolder !== null) chmodSync(lockedFolder, 0o700)
  lockedFolder = null
})

function fixtureMigrations(): string {
  return writeMigrations(mkdtempSync(join(tmpdir(), 'aletheia-migrations-')), FIXTURE_MIGRATIONS)
}

function sha256(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function advancingClock(): () => Date {
  let calls = 0
  return () => new Date(Date.parse(FIXED_INSTANT) + calls++)
}

async function fixtureTables(path: string, migrationsDir?: string): Promise<unknown[]> {
  const store = await openTestStore(path, migrationsDir)
  const tables = store.$client
    .prepare("select name from sqlite_master where name like 'fixture_%' order by name")
    .all()
  closeStore(store)
  return tables
}

describe('aletheia backup', () => {
  it('000-US3-AS1 backup prints the copy written and none removed, TOON by default', async () => {
    const { code, stdout } = await backup()

    expect(code).toBe(0)
    expect(stdout).toBe(`path: ${copy}\nremoved: []\n`)
    expect(existsSync(copy)).toBe(true)
  })

  it('000-US3-AS1 --json prints the same fields as one-line JSON', async () => {
    const { code, stdout } = await backup(['--json'])

    expect(code).toBe(0)
    expect(stdout).toBe(`{"path":"${copy}","removed":[]}\n`)
  })

  it('000-US3-AS2 backup over five copies prints the one it removed', async () => {
    const folder = join(dataDir, 'backups')
    mkdirSync(folder)
    for (const day of ['01', '02', '03', '04', '05']) {
      writeFileSync(join(folder, `custom-2026-11-${day}T10-00-00-000Z.sqlite`), '')
    }

    const { code, stdout } = await backup()

    expect(code).toBe(0)
    expect(stdout).toBe(
      `path: ${copy}\nremoved[1]: ${join(folder, 'custom-2026-11-01T10-00-00-000Z.sqlite')}\n`,
    )
  })

  it('000-US1-AS2 backup prints env: custom (<path>) as the first stderr line and only its result on stdout', async () => {
    const { stdout, stderr } = await backup()

    expect(stderr).toBe(`env: custom (${db})\n`)
    expect(stdout).toBe(`path: ${copy}\nremoved: []\n`)
  })

  it('backup --help opens no store and prints no env: line', async () => {
    const { code, stdout, stderr } = await backup(['--help'])

    expect(code).toBe(0)
    expect(stdout).toContain('Usage: aletheia backup')
    expect(stderr).toBe('')
    expect(existsSync(db)).toBe(false)
  })

  it('000-US1-AS5 an unknown command exits 1 naming it', async () => {
    const { code, stdout, stderr } = await runCli(['nope'], { vars: { ALETHEIA_DB: db } })

    expect(code).toBe(1)
    expect(stderr).toContain("error: unknown command 'nope'")
    expect(stdout).toBe('')
  })

  it('000-US1-AS5 backup --bogus opens no store', async () => {
    const { code, stdout, stderr } = await backup(['--bogus'])

    expect(code).toBe(1)
    expect(stderr).toContain("error: unknown option '--bogus'")
    expect(stdout).toBe('')
    expect(existsSync(db)).toBe(false)
  })

  it('000-US3-AS1 backup creates <dataDir>/backups when the data folder is missing', async () => {
    const missing = join(dataDir, 'missing')
    const written = join(missing, 'backups', 'custom-2026-11-08T21-04-05-123Z.sqlite')

    const { code, stdout } = await runCli(['backup'], {
      vars: { ALETHEIA_DB: db },
      dataDir: missing,
    })

    expect(code).toBe(0)
    expect(stdout).toBe(`path: ${written}\nremoved: []\n`)
    expect(existsSync(written)).toBe(true)
  })

  it('000-US3-AS3 an unwritable backup folder exits 1 with no copy left and the store unchanged', async () => {
    const store = await openTestStore(db)
    store.$client.exec(
      "create table notes (id integer primary key, body text); insert into notes (body) values ('first')",
    )
    closeStore(store)
    const before = sha256(db)
    const folder = join(dataDir, 'backups')
    mkdirSync(folder, { mode: 0o500 })
    lockedFolder = folder

    const { code, stdout, stderr } = await backup()

    expect(code).toBe(1)
    expect(stderr).toMatch(
      new RegExp(
        `^${RegExp.escape(`env: custom (${db})\nerror: cannot write backup to ${folder}: `)}.+\n$`,
      ),
    )
    expect(stdout).toBe('')
    expect(readdirSync(folder)).toEqual([])
    expect(sha256(db)).toBe(before)
  })

  it('INV-01 backup with no data folder exits 1 and writes no copy', async () => {
    const { code, stdout, stderr } = await runCli(['backup'], { vars: { ALETHEIA_DB: db } })

    expect(code).toBe(1)
    expect(stderr).toBe(`env: custom (${db})\nerror: backups are disabled here (under vitest)\n`)
    expect(stdout).toBe('')
    expect(existsSync(join(dataDir, 'backups'))).toBe(false)
  })

  it('000-US4-AS1 backup on a new store applies the migrations first', async () => {
    const migrationsDir = fixtureMigrations()

    const { code, stderr } = await runCli(['backup'], {
      vars: { ALETHEIA_DB: db },
      dataDir,
      migrationsDir,
    })

    expect(code).toBe(0)
    expect(stderr).toBe(
      `env: custom (${db})\nmigrated: 20261108000000_first\nmigrated: 20261108000100_second\n`,
    )
    expect(await fixtureTables(copy, migrationsDir)).toEqual([
      { name: 'fixture_a' },
      { name: 'fixture_b' },
    ])
  })

  it('in a non-prod env pending migrations apply without a backup', async () => {
    const { code, stderr } = await runCli(['--env', 'test', 'backup'], {
      dataDir,
      migrationsDir: fixtureMigrations(),
    })

    expect(code).toBe(0)
    expect(stderr).toBe(
      'env: test\nmigrated: 20261108000000_first\nmigrated: 20261108000100_second\n',
    )
    expect(readdirSync(join(dataDir, 'backups'))).toEqual(['test-2026-11-08T21-04-05-123Z.sqlite'])
  })

  it('000-US4-AS2 a prod store with pending migrations is backed up before they apply', async () => {
    const folder = join(dataDir, 'backups')
    const beforeMigrating = join(folder, 'prod-2026-11-08T21-04-05-123Z.sqlite')

    const { code, stderr } = await runCli(['--env', 'prod', 'backup'], {
      dataDir,
      migrationsDir: fixtureMigrations(),
      clock: advancingClock(),
    })

    expect(code).toBe(0)
    expect(stderr).toBe(
      `env: prod\nbackup: ${beforeMigrating} (before migrating)\n` +
        'migrated: 20261108000000_first\nmigrated: 20261108000100_second\n',
    )
    expect(await fixtureTables(beforeMigrating)).toEqual([])
    expect(readdirSync(folder)).toEqual([
      'prod-2026-11-08T21-04-05-123Z.sqlite',
      'prod-2026-11-08T21-04-05-124Z.sqlite',
    ])
  })

  it('000-US4-AS3 a current store takes no backup and reports nothing about schema', async () => {
    const folder = join(dataDir, 'backups')
    const prod = { dataDir, migrationsDir: fixtureMigrations(), clock: advancingClock() }
    await runCli(['--env', 'prod', 'backup'], prod)
    const before = readdirSync(folder)

    const { code, stderr } = await runCli(['--env', 'prod', 'backup'], prod)

    expect(code).toBe(0)
    expect(stderr).toBe('env: prod\n')
    expect(readdirSync(folder).filter((name) => !before.includes(name))).toHaveLength(1)
  })
})
