import { join } from 'node:path'
import { main } from '#shell/cli'
import { countingDraw } from '../draws/draws.ts'
import { SHIPPED_MIGRATIONS } from '../fixture-migrations/fixture-migrations.constants.ts'
import { noMigrations } from '../fixture-migrations/fixture-migrations.ts'
import { captureStream } from '../streams/streams.ts'
import { tempDir } from '../temp-dir/temp-dir.ts'
import { FIXED_INSTANT } from './run-cli.constants.ts'
import type { CliOverrides, CliRun, StoreCli } from './run-cli.types.ts'

export async function runCli(argv: string[], overrides: CliOverrides = {}): Promise<CliRun> {
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await main(argv, {
    version: 'dev',
    vars: {},
    clock: () => new Date(FIXED_INSTANT),
    timeZone: 'America/Bogota',
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

export function cliOnTempStore(overrides: CliOverrides = {}): StoreCli {
  const db = join(tempDir('aletheia-cli-'), 'store.sqlite')
  return { db, run: (argv, stdin = '') => runOnStore(db, argv, stdin, overrides) }
}
