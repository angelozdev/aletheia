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
})
