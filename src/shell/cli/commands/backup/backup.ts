import { backupStore, type Store } from '#shell/db'
import type { Env } from '../../invocation/env/env.types.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand, CliContext } from '../../main/main.types.ts'
import { BackupsDisabledError } from './backup.errors.ts'

function backUp({ dataDir, clock }: CliContext, db: Store, env: Env) {
  if (dataDir === null) throw new BackupsDisabledError()
  return backupStore({ db, env: env.name, root: dataDir, now: clock() })
}

export const backupCommand: CliCommand = {
  name: 'backup',
  description: "copy the current env's store to its backups folder",
  run: (context, options) => withStore(context, options, (db, env) => backUp(context, db, env)),
}
