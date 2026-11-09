import type { Output, Release } from '#shell/cli'

type RunResult = { status: number; stdout: string; stderr: string }

type Runner = (command: string, args: string[], options?: { cwd?: string }) => Promise<RunResult>

type ReleaseDeps = {
  run: Runner
  build(release: Release): Promise<void>
  packageJson: { version: string; scripts: Record<string, string> }
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

export async function release(deps: ReleaseDeps): Promise<number> {
  const reason = await refusal(deps)
  if (reason === undefined) return 0
  deps.stderr.write(`release: refused: ${reason}\n`)
  return 1
}
