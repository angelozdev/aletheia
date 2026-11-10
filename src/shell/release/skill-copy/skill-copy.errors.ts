import { ReleaseError } from '../release/release.errors.ts'

export class SkillCopyFailedError extends ReleaseError {
  readonly folder: string

  constructor(folder: string, cause: Error) {
    super(`release: failed: cannot copy the skill to ${folder}: ${cause.message}`)
    this.folder = folder
  }
}
