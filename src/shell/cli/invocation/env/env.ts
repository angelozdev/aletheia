import { CUSTOM_ENV, DB_VAR } from './env.constants.ts'
import { DatabaseNotSetError } from './env.errors.ts'
import type { Env, EnvSources } from './env.types.ts'

export function resolveEnv({ vars }: EnvSources): Env {
  const dbPath = vars[DB_VAR]
  if (dbPath === undefined) throw new DatabaseNotSetError()
  return { name: CUSTOM_ENV, dbPath }
}
