import { describe, expect, it, vi } from 'vitest'
import { fakeRunner } from '../../../../tests/support/fake-runner/fake-runner.ts'
import type { RunCall } from '../../../../tests/support/fake-runner/fake-runner.types.ts'
import { captureStream } from '../../../../tests/support/streams/streams.ts'
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

const tempDir = '/t'
const tarball = '/r/.release/aletheia-0.0.0.tgz'
const packedBin = '/t/package/dist/aletheia.js'
const released = '0.0.0 (2033257)'
const packedWithoutMigrations = ['package/package.json', 'package/dist/aletheia.js']
const onGreenMain = {
  ...onCleanMain,
  'git rev-parse --short HEAD': { stdout: '2033257\n' },
  [`tar -tzf ${tarball}`]: {
    stdout: `${[...packedWithoutMigrations, 'package/migrations/.gitkeep'].join('\n')}\n`,
  },
  [`node ${packedBin} --version`]: { stdout: `${released}\n` },
  'aletheia --version': { stdout: `${released}\n` },
}

async function releaseWith(responses: Parameters<typeof fakeRunner>[0]) {
  const runner = fakeRunner(responses)
  let callsBeforeBuild: number | undefined
  const build = vi.fn(async () => {
    callsBeforeBuild = runner.calls.length
  })
  let callsBeforeRemoval: number | undefined
  const removeTempDir = vi.fn(() => {
    callsBeforeRemoval = runner.calls.length
  })
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await release({
    run: runner.run,
    build,
    packageJson,
    repoRoot,
    makeTempDir: () => tempDir,
    removeTempDir,
    stdout,
    stderr,
  })
  return {
    code,
    stdout: stdout.text(),
    stderr: stderr.text(),
    calls: runner.calls,
    build,
    callsBeforeBuild,
    removeTempDir,
    callsBeforeRemoval,
  }
}

function expectTempDirRemovedLast(result: Awaited<ReturnType<typeof releaseWith>>) {
  expect(result.removeTempDir).toHaveBeenCalledExactlyOnceWith(tempDir)
  expect(result.callsBeforeRemoval).toBe(result.calls.length)
}

function step(line: string, cwd?: string) {
  const [command = '', ...args] = line.split(' ')
  return { command, args, cwd }
}

function commandLines(calls: RunCall[]) {
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

describe('release from a clean green main', () => {
  it('000-US2-AS1 builds, packs, smoke-runs and installs from a clean green main', async () => {
    const result = await releaseWith(onGreenMain)

    expect(result.calls.slice(0, result.callsBeforeBuild)).toEqual([
      step('git rev-parse --abbrev-ref HEAD', repoRoot),
      step('git status --porcelain', repoRoot),
      ...checks.map((name) => step(`pnpm run ${name}`, repoRoot)),
      step('git rev-parse --short HEAD', repoRoot),
    ])
    expect(result.build).toHaveBeenCalledWith({ version: '0.0.0', commit: '2033257', repoRoot })
    expect(result.calls.slice(result.callsBeforeBuild)).toEqual([
      step('pnpm pack --pack-destination .release', repoRoot),
      step(`tar -tzf ${tarball}`),
      step(`tar -xzf ${tarball} -C ${tempDir}`),
      step(`node ${packedBin} --help`, tempDir),
      step(`node ${packedBin} --version`, tempDir),
      step(`pnpm add -g ${tarball}`, tempDir),
      step('aletheia --version', tempDir),
    ])
    expect(result).toMatchObject({
      code: 0,
      stdout: `release: ${released} installed\n`,
      stderr: '',
    })
  })

  it('refuses before installing when the package has no migrations/ folder', async () => {
    const result = await releaseWith({
      ...onGreenMain,
      [`tar -tzf ${tarball}`]: { stdout: `${packedWithoutMigrations.join('\n')}\n` },
    })

    expect(result).toMatchObject({
      code: 1,
      stdout: '',
      stderr: 'release: refused: package is missing migrations/\n',
    })
    expect(commandLines(result.calls).filter((line) => line.startsWith('pnpm add'))).toEqual([])
  })

  it('refuses before installing when the packed CLI fails its smoke run', async () => {
    const result = await releaseWith({
      ...onGreenMain,
      [`node ${packedBin} --version`]: { stdout: 'dev\n' },
    })

    expect(result).toMatchObject({
      code: 1,
      stdout: '',
      stderr: `release: refused: smoke run failed: --version printed "dev", expected "${released}"\n`,
    })
    expect(commandLines(result.calls).filter((line) => line.startsWith('pnpm add'))).toEqual([])
  })

  it('refuses before installing when the packed --help fails', async () => {
    const result = await releaseWith({
      ...onGreenMain,
      [`node ${packedBin} --help`]: { status: 1 },
    })

    expect(result).toMatchObject({
      code: 1,
      stdout: '',
      stderr: 'release: refused: smoke run failed: --help exited 1\n',
    })
    expect(commandLines(result.calls).filter((line) => line.startsWith('pnpm add'))).toEqual([])
  })

  it('reports a PATH mismatch after installing', async () => {
    const result = await releaseWith({
      ...onGreenMain,
      'aletheia --version': { stdout: '0.0.0 (1111111)\n' },
    })

    expect(result).toMatchObject({
      code: 1,
      stdout: '',
      stderr: `release: failed: aletheia on PATH prints "0.0.0 (1111111)", expected "${released}"\n`,
    })
  })
})

describe('release temp folder', () => {
  it('removes its temp folder after its last command once installed', async () => {
    const result = await releaseWith(onGreenMain)

    expect(result.code).toBe(0)
    expectTempDirRemovedLast(result)
  })

  it('removes its temp folder when the smoke run fails', async () => {
    const result = await releaseWith({
      ...onGreenMain,
      [`node ${packedBin} --help`]: { status: 1 },
    })

    expect(result.stderr).toBe('release: refused: smoke run failed: --help exited 1\n')
    expectTempDirRemovedLast(result)
  })

  it('removes its temp folder when PATH prints another version', async () => {
    const result = await releaseWith({
      ...onGreenMain,
      'aletheia --version': { stdout: '0.0.0 (1111111)\n' },
    })

    expect(result.stderr).toContain('release: failed: aletheia on PATH prints')
    expectTempDirRemovedLast(result)
  })
})
