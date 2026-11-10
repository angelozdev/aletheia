import { cpSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { PARTIAL_SUFFIX, SKILL_NAME } from './skill-copy.constants.ts'
import { SkillCopyFailedError } from './skill-copy.errors.ts'
import type { SkillCopyRequest } from './skill-copy.types.ts'

function removeFolder(path: string): void {
  rmSync(path, { recursive: true, force: true })
}

export function copySkill({ source, skillsDir }: SkillCopyRequest): string {
  const destination = join(skillsDir, SKILL_NAME)
  const partial = `${destination}${PARTIAL_SUFFIX}`
  try {
    removeFolder(partial)
    cpSync(source, partial, { recursive: true })
    removeFolder(destination)
    renameSync(partial, destination)
  } catch (error) {
    removeFolder(partial)
    if (!(error instanceof Error)) throw error
    throw new SkillCopyFailedError(destination, error)
  }
  return destination
}
