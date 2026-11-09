import { existsSync } from 'node:fs'
import { mkdir, rename } from 'node:fs/promises'
import { join } from 'node:path'
import { backup } from 'node:sqlite'
import { backupFileName } from '#core/backups'
import { BACKUPS_FOLDER, PARTIAL_SUFFIX } from './backups.constants.ts'
import type { BackupRequest, BackupResult } from './backups.types.ts'

async function backupsFolder(root: string): Promise<string> {
  const folder = join(root, BACKUPS_FOLDER)
  if (!existsSync(folder)) await mkdir(folder)
  return folder
}

export async function backupStore({ db, env, root, now }: BackupRequest): Promise<BackupResult> {
  const path = join(await backupsFolder(root), backupFileName(env, now))
  const partial = `${path}${PARTIAL_SUFFIX}`
  await backup(db, partial)
  await rename(partial, path)
  return { path, removed: [] }
}
