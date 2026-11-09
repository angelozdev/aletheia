import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { buildRelease } from './build.ts'
import { release, type Runner } from './release.ts'

const repoRoot = join(import.meta.dirname, '..', '..', '..')

const run: Runner = (command, args, options) => {
  const result = spawnSync(command, args, { cwd: options?.cwd, encoding: 'utf8' })
  return Promise.resolve({
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? result.error?.message ?? '',
  })
}

process.exitCode = await release({
  run,
  build: buildRelease,
  packageJson: JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')),
  repoRoot,
  makeTempDir: () => mkdtempSync(join(tmpdir(), 'aletheia-release-')),
  stdout: process.stdout,
  stderr: process.stderr,
})
