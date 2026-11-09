import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { runCli } from '../../../../../tests/support/run-cli/run-cli.ts'

let db: string
let root: string
let copy: string

function backup(argv: string[] = []) {
  return runCli(['backup', ...argv], { vars: { ALETHEIA_DB: db }, backupRoot: root })
}

beforeEach(() => {
  db = join(mkdtempSync(join(tmpdir(), 'aletheia-cli-')), 'store.sqlite')
  root = mkdtempSync(join(tmpdir(), 'aletheia-icloud-'))
  copy = join(root, 'aletheia-backups', 'custom-2026-11-08T21-04-05-123Z.sqlite')
})

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

  it('INV-01 backup with no backup root exits 1 and writes no copy', async () => {
    const { code, stdout, stderr } = await runCli(['backup'], { vars: { ALETHEIA_DB: db } })

    expect(code).toBe(1)
    expect(stderr).toBe(`env: custom (${db})\nerror: backups are disabled here (under vitest)\n`)
    expect(stdout).toBe('')
    expect(existsSync(join(root, 'aletheia-backups'))).toBe(false)
  })
})
