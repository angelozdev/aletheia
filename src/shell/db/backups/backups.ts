import { existsSync } from 'node:fs'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { backup } from 'node:sqlite'
import { backupFileName, copiesToRemove } from '#core/backups'
import { BACKUPS_FOLDER, PARTIAL_SUFFIX } from './backups.constants.ts'
import { ICloudDriveNotFoundError } from './backups.errors.ts'
import type { BackupRequest, BackupResult } from './backups.types.ts'

async function backupsFolder(root: string): Promise<string> {
  const folder = join(root, BACKUPS_FOLDER)
  if (!existsSync(folder)) await mkdir(folder)
  return folder
}

async function removeOldCopies(folder: string, env: string): Promise<string[]> {
  const removed = copiesToRemove(env, await readdir(folder)).map((name) => join(folder, name))
  await Promise.all(removed.map((path) => rm(path)))
  return removed
}

export async function backupStore({ db, env, root, now }: BackupRequest): Promise<BackupResult> {
  if (!existsSync(root)) throw new ICloudDriveNotFoundError(root)
  const folder = await backupsFolder(root)
  const path = join(folder, backupFileName(env, now))
  const partial = `${path}${PARTIAL_SUFFIX}`
  await backup(db, partial)
  await rename(partial, path)
  return { path, removed: await removeOldCopies(folder, env) }
}
