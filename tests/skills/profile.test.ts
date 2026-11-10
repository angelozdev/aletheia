import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT } from '#shell/cli'
import { readSkill } from '../support/skills/skills.ts'

function checkIgnore(path: string): void {
  execFileSync('git', ['check-ignore', '-q', path], { cwd: REPO_ROOT })
}

describe('the profile', () => {
  it('002-US2-AS2 git ignores PROFILE.md at the repo root', () => {
    expect(() => checkIgnore('PROFILE.md')).not.toThrow()
    expect(() => checkIgnore('skills/PROFILE.md')).toThrow()
  })

  it.for(['skills/az-aletheia-add/SKILL.md', '.claude/skills/aletheia-review/SKILL.md'])(
    '002-US3-AS1 both skills offer a profile change and write it only after Angelo approves: %s',
    (path) => {
      const { text } = readSkill(path)

      for (const phrase of [
        '~/me/aletheia/PROFILE.md',
        '¿Anoto en tu perfil',
        '¿Cambio en tu perfil',
        'only after Angelo approves',
      ])
        expect(text).toContain(phrase)
    },
  )
})
