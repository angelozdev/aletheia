import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runCli } from '../../../../../tests/support/run-cli/run-cli.ts'
import { tempDir } from '../../../../../tests/support/temp-dir/temp-dir.ts'
import { REPO_ROOT } from '../../bin/bin.constants.ts'
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

  it('the source context finds migrations in <repoRoot>/migrations and the release context in <entryDir>/../migrations', () => {
    expect(sourceContext({ repoRoot: '/r', vars: {}, home: '/h' }).migrationsDir).toBe(
      '/r/migrations',
    )
    expect(releasedContext(released({})).migrationsDir).toBe('/pkg/migrations')
  })

  it('000-US1-AS3 backup from the release context uses prod in <home>/.aletheia, creating the folder', async () => {
    const home = tempDir('aletheia-home-')
    const entryDir = join(REPO_ROOT, 'dist')

    const { code, stderr } = await runCli(
      ['backup'],
      releasedContext({ ...released({}), home, entryDir }),
    )

    expect(code).toBe(0)
    expect(stderr).toBe('env: prod\n')
    expect(existsSync(join(home, '.aletheia', 'prod.sqlite'))).toBe(true)
    expect(readdirSync(join(home, '.aletheia', 'backups'))).toEqual([
      expect.stringMatching(/^prod-.+\.sqlite$/),
    ])
  })

  it('INV-01 under vitest the contexts have no data folder, so named envs are refused', async () => {
    const vars = { VITEST: 'true' }
    const repoRoot = tempDir('aletheia-repo-')
    const source = sourceContext({ repoRoot, vars, home: '/h' })
    const refusal = (from: string) =>
      `error: named environments are disabled here (${from}); set ALETHEIA_DB to a temporary file\n`

    expect(source.dataDir).toBeNull()
    expect(releasedContext(released(vars)).dataDir).toBeNull()
    expect(await runCli(['backup'], source)).toEqual({
      code: 1,
      stdout: '',
      stderr: refusal('default: test'),
    })
    expect((await runCli(['--env', 'prod', 'backup'], source)).stderr).toBe(refusal('--env: prod'))
    expect(
      (await runCli(['backup'], { ...source, vars: { ...vars, ALETHEIA_ENV: 'x' } })).stderr,
    ).toBe(refusal('ALETHEIA_ENV: x'))
    expect(existsSync(join(repoRoot, 'data'))).toBe(false)
  })
})
