import { describe, expect, it, vi } from 'vitest'
import { fakeRunner } from '../../../tests/support/fake-runner.ts'
import { captureStream } from '../../../tests/support/streams.ts'
import { release } from './release.ts'

const repoRoot = '/r'
const checks = ['test', 'lint', 'format:check', 'typecheck', 'dead-code', 'duplication']
const packageJson = {
  name: 'aletheia',
  version: '0.0.0',
  scripts: { check: checks.map((name) => `pnpm ${name}`).join(' && ') },
}
const onCleanMain = {
  'git rev-parse --abbrev-ref HEAD': { stdout: 'main\n' },
  'git status --porcelain': { stdout: '' },
}

async function releaseWith(responses: Parameters<typeof fakeRunner>[0]) {
  const runner = fakeRunner(responses)
  const build = vi.fn(async () => {})
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await release({
    run: runner.run,
    build,
    packageJson,
    repoRoot,
    makeTempDir: () => '/t',
    stdout,
    stderr,
  })
  return { code, stdout: stdout.text(), stderr: stderr.text(), calls: runner.calls, build }
}

function commandLines(calls: { command: string; args: string[] }[]) {
  return calls.map(({ command, args }) => [command, ...args].join(' '))
}

function expectRefused(result: Awaited<ReturnType<typeof releaseWith>>, reason: string) {
  expect(result.code).toBe(1)
  expect(result.stderr).toBe(`release: refused: ${reason}\n`)
  expect(result.stdout).toBe('')
  expect(result.build).not.toHaveBeenCalled()
  const lines = commandLines(result.calls)
  expect(lines.filter((line) => line.startsWith('pnpm pack'))).toEqual([])
  expect(lines.filter((line) => line.startsWith('pnpm add'))).toEqual([])
}

describe('release refusals', () => {
  it('000-US2-AS2 refuses off main', async () => {
    const result = await releaseWith({ 'git rev-parse --abbrev-ref HEAD': { stdout: 'feature\n' } })

    expectRefused(result, 'on feature, not main')
  })

  it('000-US2-AS2 refuses with uncommitted changes', async () => {
    const result = await releaseWith({
      ...onCleanMain,
      'git status --porcelain': { stdout: ' M src/x.ts\n' },
    })

    expectRefused(result, 'uncommitted changes')
  })

  it('000-US2-AS2 refuses naming the failing check', async () => {
    const result = await releaseWith({ ...onCleanMain, 'pnpm run lint': { status: 1 } })

    expectRefused(result, 'lint failed')
    expect(commandLines(result.calls).filter((line) => line.startsWith('pnpm run'))).toEqual([
      'pnpm run test',
      'pnpm run lint',
    ])
    expect(result.calls.find(({ args }) => args.includes('lint'))?.cwd).toBe(repoRoot)
  })
})
