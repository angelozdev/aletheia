import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { closeStore, openStore, type Store } from '#shell/db'
import { ExitCode } from '../../main/main.constants.ts'
import type { CliContext, GlobalOptions } from '../../main/main.types.ts'
import { backUpEnv } from '../env-backup/env-backup.ts'
import { CUSTOM_ENV, PROD_ENV } from '../env/env.constants.ts'
import { resolveEnv } from '../env/env.ts'
import type { Env } from '../env/env.types.ts'
import {
  writeBackupBeforeMigratingLine,
  writeEnvLine,
  writeError,
  writeMigratedLine,
  writeResult,
} from '../output/output.ts'
import type { StoreAction } from './with-store.types.ts'

async function backUpBeforeMigrating(
  context: CliContext,
  env: Env,
  store: Store,
  pending: string[],
): Promise<void> {
  if (env.name !== PROD_ENV || pending.length === 0) return
  const { path } = await backUpEnv(context, store, env)
  writeBackupBeforeMigratingLine(context.stderr, path)
}

async function openEnvStore(context: CliContext, env: Env): Promise<Store> {
  if (env.name !== CUSTOM_ENV) await mkdir(dirname(env.dbPath), { recursive: true })
  return openStore({
    path: env.dbPath,
    migrationsDir: context.migrationsDir,
    beforeMigrating: (store, pending) => backUpBeforeMigrating(context, env, store, pending),
    onMigrated: (migration) => writeMigratedLine(context.stderr, migration),
  })
}

async function runAgainstStore(
  context: CliContext,
  options: GlobalOptions,
  action: StoreAction,
): Promise<unknown> {
  const env = resolveEnv({
    flag: options.env,
    vars: context.vars,
    defaultEnv: context.defaultEnv,
    dataDir: context.dataDir,
  })
  writeEnvLine(context.stderr, env)
  const store = await openEnvStore(context, env)
  try {
    return await action(store, env)
  } finally {
    closeStore(store)
  }
}

export async function withStore(
  context: CliContext,
  options: GlobalOptions,
  action: StoreAction,
): Promise<number> {
  try {
    const result = await runAgainstStore(context, options, action)
    writeResult(context.stdout, result, options.json === true)
    return ExitCode.Success
  } catch (error) {
    if (!(error instanceof Error)) throw error
    writeError(context.stderr, error.message)
    return ExitCode.Failure
  }
}
