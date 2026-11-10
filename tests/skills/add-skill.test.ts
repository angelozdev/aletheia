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

  it('002-US1-AS7 az-aletheia-add searches every draft before showing any and flags a repeat', () => {
    const skill = readSkill('skills/az-aletheia-add/SKILL.md')

    for (const text of ['aletheia card search', 'synonyms', 'duplica a #', 'se solapa con #'])
      expect(skill.text).toContain(text)
    expect(skill.text.indexOf('aletheia card search')).toBeLessThan(
      skill.text.indexOf('## 3. Show every draft'),
    )
  })

  it('002-US2-AS1 az-aletheia-add reads the profile before drafting and flags junk with its reason', () => {
    const skill = readSkill('skills/az-aletheia-add/SKILL.md')

    for (const text of ['trivia', 'ya lo sabes por tu perfil', 'sin situación creíble'])
      expect(skill.text).toContain(text)
    expect(skill.text.indexOf('~/me/aletheia/PROFILE.md')).toBeGreaterThan(-1)
    expect(skill.text.indexOf('~/me/aletheia/PROFILE.md')).toBeLessThan(
      skill.text.indexOf('## 1. Draft'),
    )
  })
})
