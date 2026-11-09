import { backupStore, type Store } from '#shell/db'
import type { CliContext } from '../../main/main.types.ts'
import type { Env } from '../env/env.types.ts'
import { BackupsDisabledError } from './env-backup.errors.ts'

export function backUpEnv({ dataDir, clock }: CliContext, db: Store, env: Env) {
  if (dataDir === null) throw new BackupsDisabledError()
  return backupStore({ db, env: env.name, root: dataDir, now: clock() })
}
