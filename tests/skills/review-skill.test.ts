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

  it('003-US2-AS5 aletheia-review stops at the cap, says how many remain, goes on only if Angelo says so, and passes a session size he names', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    for (const text of ['--session', 'capReached', 'remaining', '--session-size', 'hoy solo 10'])
      expect(skill.text).toContain(text)
  })

  it('aletheia-review mentions held-back new cards and passes a daily limit Angelo names for the session', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    for (const text of ['heldBack', '--new-per-day', 'hoy dame 20 nuevas'])
      expect(skill.text).toContain(text)
  })

  it('aletheia-review passes a share of new cards Angelo names for the session', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    expect(skill.text).toContain('--new-share')
  })

  it('003-US4-AS4 aletheia-review saves a lasting limit through aletheia settings set only after Angelo approves the exact change', () => {
    const skill = readSkill('.claude/skills/aletheia-review/SKILL.md')

    for (const text of [
      'aletheia settings show',
      'aletheia settings set',
      'a partir de ahora',
      'hoy solo 10',
      'the exact command',
    ])
      expect(skill.text).toContain(text)
  })
})
