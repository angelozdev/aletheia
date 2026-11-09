import { join } from 'node:path'
import type { Output, Release } from '#shell/cli'

type RunResult = { status: number; stdout: string; stderr: string }

export type Runner = (
  command: string,
  args: string[],
  options?: { cwd?: string },
) => Promise<RunResult>

type ReleaseDeps = {
  run: Runner
  build(release: Release): Promise<void>
  packageJson: { name: string; version: string; scripts: Record<string, string> }
  repoRoot: string
  makeTempDir(): string
  stdout: Output
  stderr: Output
}

function checkNames(checkScript: string): string[] {
  return checkScript.split('&&').map((step) => step.trim().replace(/^pnpm /, ''))
}

async function refusal({ run, packageJson, repoRoot }: ReleaseDeps): Promise<string | undefined> {
  const inRepo = { cwd: repoRoot }
  const branch = (await run('git', ['rev-parse', '--abbrev-ref', 'HEAD'], inRepo)).stdout.trim()
  if (branch !== 'main') return `on ${branch}, not main`
  const changes = (await run('git', ['status', '--porcelain'], inRepo)).stdout.trim()
  if (changes) return 'uncommitted changes'
  for (const check of checkNames(packageJson.scripts.check)) {
    const { status } = await run('pnpm', ['run', check], inRepo)
    if (status !== 0) return `${check} failed`
  }
  return undefined
}

async function smokeFailure(
  run: Runner,
  packageDir: string,
  expected: string,
): Promise<string | undefined> {
  const inPackage = { cwd: packageDir }
  const bin = join(packageDir, 'package', 'dist', 'aletheia.js')
  const help = await run('node', [bin, '--help'], inPackage)
  if (help.status !== 0) return `--help exited ${help.status}`
  const printed = (await run('node', [bin, '--version'], inPackage)).stdout.trim()
  if (printed !== expected) return `--version printed "${printed}", expected "${expected}"`
  return undefined
}

function refuse(stderr: Output, reason: string): number {
  stderr.write(`release: refused: ${reason}\n`)
  return 1
}

async function buildAndInstall(deps: ReleaseDeps): Promise<number> {
  const { run, packageJson, repoRoot, stdout, stderr } = deps
  const commit = (
    await run('git', ['rev-parse', '--short', 'HEAD'], { cwd: repoRoot })
  ).stdout.trim()
  await deps.build({ version: packageJson.version, commit, repoRoot })
  const expected = `${packageJson.version} (${commit})`
  await run('pnpm', ['pack', '--pack-destination', '.release'], { cwd: repoRoot })
  const tarball = join(repoRoot, '.release', `${packageJson.name}-${packageJson.version}.tgz`)
  const packageDir = deps.makeTempDir()
  await run('tar', ['-xzf', tarball, '-C', packageDir])
  const smoke = await smokeFailure(run, packageDir, expected)
  if (smoke !== undefined) return refuse(stderr, `smoke run failed: ${smoke}`)
  await run('pnpm', ['add', '-g', tarball], { cwd: packageDir })
  const onPath = (await run('aletheia', ['--version'], { cwd: packageDir })).stdout.trim()
  if (onPath !== expected) {
    stderr.write(`release: failed: aletheia on PATH prints "${onPath}", expected "${expected}"\n`)
    return 1
  }
  stdout.write(`release: ${expected} installed\n`)
  return 0
}

export async function release(deps: ReleaseDeps): Promise<number> {
  const reason = await refusal(deps)
  if (reason !== undefined) return refuse(deps.stderr, reason)
  return buildAndInstall(deps)
}
