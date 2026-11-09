import {
  BACKUP_EXTENSION,
  COPIES_KEPT,
  ENV_SEPARATOR,
  SAFE_INSTANT_CHAR,
  STAMPED_COPY_PATTERN,
  UNSAFE_INSTANT_CHARS,
} from './backups.constants.ts'

export function backupFileName(env: string, instant: Date): string {
  const stamp = instant.toISOString().replace(UNSAFE_INSTANT_CHARS, SAFE_INSTANT_CHAR)
  return `${env}${ENV_SEPARATOR}${stamp}${BACKUP_EXTENSION}`
}

function isCopyOf(env: string, name: string): boolean {
  const prefix = `${env}${ENV_SEPARATOR}`
  return name.startsWith(prefix) && STAMPED_COPY_PATTERN.test(name.slice(prefix.length))
}

export function copiesToRemove(env: string, names: string[], keep = COPIES_KEPT): string[] {
  const copies = names.filter((name) => isCopyOf(env, name)).toSorted()
  return copies.slice(0, Math.max(0, copies.length - keep))
}
