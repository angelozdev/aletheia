import { closeStore, openStore } from '#shell/db'
import { ExitCode } from '../../main/main.constants.ts'
import type { CliContext, GlobalOptions } from '../../main/main.types.ts'
import { resolveEnv } from '../env/env.ts'
import { writeEnvLine, writeError, writeResult } from '../output/output.ts'
import type { StoreAction } from './with-store.types.ts'

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
  const store = openStore(env.dbPath)
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
