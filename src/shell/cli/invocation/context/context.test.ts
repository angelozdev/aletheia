import { existsSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runCli } from '../../../../../tests/support/run-cli/run-cli.ts'
import { releasedContext, sourceContext } from './context.ts'
import type { ReleasedInvocation } from './context.types.ts'

function released(vars: ReleasedInvocation['vars']): ReleasedInvocation {
  return {
    release: { version: '0.0.0', commit: '2033257', repoRoot: '/r' },
    entryDir: '/pkg/dist',
    vars,
    home: '/h',
  }
}

function tempDir(prefix: string): string {
  return mkdtempSync(join(tmpdir(), prefix))
}

function printedVersion(context: ReturnType<typeof sourceContext>) {
  return runCli(['--version'], context)
}

describe('invocation context', () => {
  it('000-US2-AS3 the release context prints <version> (<commit>) for --version', async () => {
    const context = releasedContext(released({}))

    expect(await printedVersion(context)).toEqual({
      code: 0,
      stdout: '0.0.0 (2033257)\n',
      stderr: '',
    })
  })

  it('the source context prints dev', async () => {
    const context = sourceContext({ repoRoot: '/r', vars: {}, home: '/h' })

    expect(await printedVersion(context)).toEqual({ code: 0, stdout: 'dev\n', stderr: '' })
  })

  it('both contexts back up to iCloud Drive under home', () => {
    const iCloudDrive = '/h/Library/Mobile Documents/com~apple~CloudDocs'

    expect(sourceContext({ repoRoot: '/r', vars: {}, home: '/h' }).backupRoot).toBe(iCloudDrive)
    expect(releasedContext(released({})).backupRoot).toBe(iCloudDrive)
  })

  it('INV-01 under vitest neither context has a backup root', () => {
    const vars = { VITEST: 'true' }

    expect(sourceContext({ repoRoot: '/r', vars, home: '/h' }).backupRoot).toBeNull()
    expect(releasedContext(released(vars)).backupRoot).toBeNull()
  })

  it('000-US1-AS3 the source context defaults to test under <repoRoot>/data and the release context to prod under <home>/.aletheia', () => {
    expect(sourceContext({ repoRoot: '/r', vars: {}, home: '/h' })).toMatchObject({
      defaultEnv: 'test',
      dataDir: '/r/data',
    })
    expect(releasedContext(released({}))).toMatchObject({
      defaultEnv: 'prod',
      dataDir: '/h/.aletheia',
    })
  })

  it('000-US1-AS3 backup from the release context uses prod in <home>/.aletheia, creating the folder', async () => {
    const home = tempDir('aletheia-home-')
    const context = {
      ...releasedContext({ ...released({}), home }),
      backupRoot: tempDir('aletheia-icloud-'),
    }

    const { code, stderr } = await runCli(['backup'], context)

    expect(code).toBe(0)
    expect(stderr).toBe('env: prod\n')
    expect(existsSync(join(home, '.aletheia', 'prod.sqlite'))).toBe(true)
  })
})
