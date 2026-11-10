import { describe, expect, it } from 'vitest'
import { DEVELOPMENT_ONLY } from '../support/skills/skills.constants.ts'
import { readSkill } from '../support/skills/skills.ts'

describe('the aletheia-review skill', () => {
  it('001-US2-AS7 aletheia-review carries its Spanish triggers and calls the installed aletheia', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    expect(skill.name).toBe('aletheia-review')
    for (const trigger of ['repasemos', 'vamos a repasar', '¿qué tengo para hoy?'])
      expect(skill.description).toContain(trigger)
    for (const command of ['aletheia review due', 'aletheia review grade'])
      expect(skill.text).toContain(command)
    for (const forbidden of DEVELOPMENT_ONLY) expect(skill.text).not.toContain(forbidden)
  })

  it('aletheia-review hands a doubt worth a card to az-aletheia-add', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    expect(skill.text).toContain('az-aletheia-add')
  })

  it('003-US1-AS8 aletheia-review maps a named topic to tags from aletheia tag list and reviews them with aletheia review topic', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    expect(skill.description).toContain('repasemos <tema>')
    for (const text of ['aletheia tag list', 'aletheia review topic', 'top-level tags'])
      expect(skill.text).toContain(text)
  })
})
