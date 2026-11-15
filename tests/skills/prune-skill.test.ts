import { describe, expect, it } from 'vitest'
import { DEVELOPMENT_ONLY } from '../support/skills/skills.constants.ts'
import { readSkill } from '../support/skills/skills.ts'

const PRUNE_SKILL = '.claude/skills/aletheia-prune/SKILL.md'

const TRIGGERS = [
  'podemos el mazo',
  'podemos <tema>',
  'limpiemos el mazo',
  'archiva #',
  'devuélveme #',
]

describe('the aletheia-prune skill', () => {
  it("007-US1-AS6 aletheia-prune carries its Spanish triggers, archives only on Angelo's choice with his reason, and restores a card he names", () => {
    const skill = readSkill(PRUNE_SKILL)
    const others = ['aletheia-review', 'aletheia-stats'].map((name) =>
      readSkill(`.claude/skills/${name}/SKILL.md`),
    )

    expect(skill.name).toBe('aletheia-prune')
    for (const trigger of TRIGGERS) {
      expect(skill.description).toContain(trigger)
      for (const other of others) expect(other.description).not.toContain(trigger)
    }
    for (const text of [
      'aletheia card show',
      'aletheia card archive',
      "<<'JSON'",
      'aletheia card restore',
      'in his words',
      'never on its own',
    ])
      expect(skill.text).toContain(text)
    for (const forbidden of DEVELOPMENT_ONLY) expect(skill.text).not.toContain(forbidden)
  })

  it('007-US1-AS6 aletheia-prune lists the candidates from aletheia card candidates one at a time, with reason and evidence, and offers archive or rewrite in place', () => {
    const skill = readSkill(PRUNE_SKILL)

    for (const text of [
      'aletheia card candidates',
      'aletheia tag list',
      'one at a time',
      'wait for Angelo',
      'lastFailure',
      'aletheia card edit',
      'same knowledge',
      'slice 8',
    ])
      expect(skill.text).toContain(text)
  })
})
