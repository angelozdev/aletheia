import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT } from '#shell/cli'

function checkIgnore(path: string): void {
  execFileSync('git', ['check-ignore', '-q', path], { cwd: REPO_ROOT })
}

describe('the profile', () => {
  it('002-US2-AS2 git ignores PROFILE.md at the repo root', () => {
    expect(() => checkIgnore('PROFILE.md')).not.toThrow()
    expect(() => checkIgnore('skills/PROFILE.md')).toThrow()
  })
})
