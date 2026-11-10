import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runCli as run } from '../../../../tests/support/run-cli/run-cli.ts'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'

describe('main', () => {
  it('000-US1-AS1 --help prints usage with --env and --json on stdout and exits 0', async () => {
    const { code, stdout, stderr } = await run(['--help'])

    expect(code).toBe(0)
    expect(stdout).toContain('Usage: aletheia')
    expect(stdout).toMatch(/--env <name>\s+use <name>\.sqlite in the data folder/)
    expect(stdout).toContain('--json')
    expect(stdout).toMatch(/^ {2}backup\s+copy the current env's store to its backups folder$/m)
    expect(stderr).toBe('')
  })

  it('000-US2-AS3 --version from the sources prints dev and opens no store', async () => {
    const { code, stdout, stderr } = await run(['--version'])

    expect(code).toBe(0)
    expect(stdout).toBe('dev\n')
    expect(stderr).toBe('')
  })

  it('000-US1-AS5 an unknown option exits 1 naming it on stderr with nothing on stdout', async () => {
    const { code, stdout, stderr } = await run(['--nope'])

    expect(code).toBe(1)
    expect(stderr).toContain("error: unknown option '--nope'")
    expect(stdout).toBe('')
  })

  it('000-US1-AS4 with --env, ALETHEIA_DB and ALETHEIA_ENV all set, backup uses --env', async () => {
    const dataDir = join(tempDir('aletheia-repo-'), 'data')
    const db = join(tempDir('aletheia-cli-'), 'store.sqlite')

    const { code, stderr } = await run(['--env', 'staging', 'backup'], {
      vars: { ALETHEIA_DB: db, ALETHEIA_ENV: 'other' },
      dataDir,
    })

    expect(code).toBe(0)
    expect(stderr).toBe('env: staging\n')
    const staging = join(dataDir, 'staging.sqlite')
    expect(existsSync(staging)).toBe(true)
    expect(existsSync(db)).toBe(false)
  })

  it('000-US1-AS4 an invalid env exits 1 before any store is opened', async () => {
    const dataDir = join(tempDir('aletheia-repo-'), 'data')

    const { code, stdout, stderr } = await run(['--env', 'Bad', 'backup'], { dataDir })

    expect(code).toBe(1)
    expect(stderr).toBe('error: invalid --env "Bad": use lowercase letters, digits and dashes\n')
    expect(stdout).toBe('')
    expect(existsSync(dataDir)).toBe(false)
  })
})
