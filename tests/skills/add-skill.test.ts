import { describe, expect, it } from 'vitest'
import { DEVELOPMENT_ONLY } from '../support/skills/skills.constants.ts'
import { readSkill } from '../support/skills/skills.ts'

describe('the az-aletheia-add skill', () => {
  it('001-US1-AS6 az-aletheia-add carries its Spanish triggers and calls the installed aletheia', () => {
    const skill = readSkill('skills/az-aletheia-add/SKILL.md')

    expect(skill.name).toBe('az-aletheia-add')
    for (const trigger of ['guarda esto', 'haz una tarjeta', 'añade esto a aletheia'])
      expect(skill.description).toContain(trigger)
    expect(skill.text).toContain('aletheia card add')
    for (const forbidden of DEVELOPMENT_ONLY) expect(skill.text).not.toContain(forbidden)
  })
})
