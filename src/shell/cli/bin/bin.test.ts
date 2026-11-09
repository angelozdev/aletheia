import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const bin = join(import.meta.dirname, 'bin.ts')

describe('source bin', () => {
  it('000-US1-AS1 the source bin prints help from a directory outside the repo', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'aletheia-bin-'))

    const result = spawnSync(process.execPath, [bin, '--help'], { cwd, encoding: 'utf8' })

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('--env')
    expect(result.stderr).toBe('')
  })

  it('INV-01 the source bin under vitest refuses its default env', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'aletheia-bin-'))
    const env = { ...process.env, ALETHEIA_DB: undefined, ALETHEIA_ENV: undefined }

    const result = spawnSync(process.execPath, [bin, 'backup'], { cwd, env, encoding: 'utf8' })

    expect(process.env.VITEST).toBeTruthy()
    expect(result.status).toBe(1)
    expect(result.stdout).toBe('')
    expect(result.stderr).toBe(
      'error: named environments are disabled here (default: test); set ALETHEIA_DB to a temporary file\n',
    )
  })
})
