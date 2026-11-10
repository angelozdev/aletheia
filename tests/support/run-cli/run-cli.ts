import { main } from '#shell/cli'
import { SHIPPED_MIGRATIONS } from '../fixture-migrations/fixture-migrations.constants.ts'
import { noMigrations } from '../fixture-migrations/fixture-migrations.ts'
import { captureStream } from '../streams/streams.ts'
import { FIXED_INSTANT } from './run-cli.constants.ts'
import type { CliOverrides, CliRun } from './run-cli.types.ts'

function countingDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => draws++ % bound
}

export async function runCli(argv: string[], overrides: CliOverrides = {}): Promise<CliRun> {
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await main(argv, {
    version: 'dev',
    vars: {},
    clock: () => new Date(FIXED_INSTANT),
    defaultEnv: 'test',
    dataDir: null,
    stdin: () => Promise.resolve(''),
    randomIndex: countingDraw(),
    ...overrides,
    migrationsDir: overrides.migrationsDir ?? noMigrations(),
    stdout,
    stderr,
  })
  return { code, stdout: stdout.text(), stderr: stderr.text() }
}

export function runOnStore(
  db: string,
  argv: string[],
  stdin = '',
  overrides: CliOverrides = {},
): Promise<CliRun> {
  return runCli(argv, {
    vars: { ALETHEIA_DB: db },
    migrationsDir: SHIPPED_MIGRATIONS,
    stdin: () => Promise.resolve(stdin),
    ...overrides,
  })
}
