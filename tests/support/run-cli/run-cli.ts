import { main } from '#shell/cli'
import { SHIPPED_MIGRATIONS } from '../fixture-migrations/fixture-migrations.constants.ts'
import { captureStream } from '../streams/streams.ts'
import { FIXED_INSTANT } from './run-cli.constants.ts'
import type { CliOverrides, CliRun } from './run-cli.types.ts'

export async function runCli(argv: string[], overrides: CliOverrides = {}): Promise<CliRun> {
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await main(argv, {
    version: 'dev',
    vars: {},
    clock: () => new Date(FIXED_INSTANT),
    defaultEnv: 'test',
    dataDir: null,
    migrationsDir: SHIPPED_MIGRATIONS,
    ...overrides,
    stdout,
    stderr,
  })
  return { code, stdout: stdout.text(), stderr: stderr.text() }
}
