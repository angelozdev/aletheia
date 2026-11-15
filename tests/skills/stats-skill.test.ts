import { describe, expect, it } from 'vitest'
import { DEVELOPMENT_ONLY } from '../support/skills/skills.constants.ts'
import { readSkill } from '../support/skills/skills.ts'

const STATS_SKILL = '.claude/skills/aletheia-stats/SKILL.md'

const TRIGGERS = [
  '¿cómo voy?',
  '¿qué tengo flojo?',
  '¿qué no repaso hace un mes?',
  '¿qué fallé esta semana?',
  'muéstrame mi progreso',
]

const WRITES = [
  'aletheia card add',
  'aletheia card edit',
  'aletheia review grade',
  'aletheia settings set',
  'aletheia backup',
]

describe('the aletheia-stats skill', () => {
  it('006-US1-AS6 aletheia-stats carries its Spanish triggers, answers every progress question from the installed aletheia, explains weak and gaps, and writes nothing', () => {
    const skill = readSkill(STATS_SKILL)
    const review = readSkill('.claude/skills/aletheia-review/SKILL.md')

    expect(skill.name).toBe('aletheia-stats')
    for (const trigger of TRIGGERS) {
      expect(skill.description).toContain(trigger)
      expect(review.description).not.toContain(trigger)
    }
    for (const text of [
      'aletheia tag stats',
      'aletheia tag list',
      'never from memory',
      '4 failures',
      'missing-prerequisite',
      'repasemos',
    ])
      expect(skill.text).toContain(text)
    for (const forbidden of [...DEVELOPMENT_ONLY, ...WRITES])
      expect(skill.text).not.toContain(forbidden)
  })
})
