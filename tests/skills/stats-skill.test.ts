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
      '3 failures',
      'missing-prerequisite',
      'repasemos',
    ])
      expect(skill.text).toContain(text)
    for (const forbidden of [...DEVELOPMENT_ONLY, ...WRITES])
      expect(skill.text).not.toContain(forbidden)
  })

  it("006-US1-AS6 aletheia-stats finds a Spanish topic's tags in aletheia tag list and passes them, and a sort, to aletheia tag stats", () => {
    const skill = readSkill(STATS_SKILL)

    for (const text of [
      'aletheia tag stats <tags>',
      '--sort retention',
      '--desc',
      '¿cuál va peor?',
    ])
      expect(skill.text).toContain(text)
  })

  it('006-US2-AS4 aletheia-stats answers a free-form question with the tree or card list filters, and says so when none answers', () => {
    const skill = readSkill(STATS_SKILL)

    for (const text of [
      'aletheia card list',
      '--weak',
      '--gaps',
      '--not-reviewed 30',
      '--sort failures --desc',
      'no query answers',
    ])
      expect(skill.text).toContain(text)
  })

  it('006-US3-AS2 aletheia-stats answers questions about past reviews from aletheia review history and quotes its counts', () => {
    const skill = readSkill(STATS_SKILL)

    for (const text of [
      'aletheia review history',
      '--days 7',
      '--days 14',
      '--grade again',
      '--flag badly-rephrased',
      'disputed',
      'quote the counts',
    ])
      expect(skill.text).toContain(text)
  })

  it('007-US1-AS6 aletheia-stats mentions the candidates count of tag stats and offers to prune them', () => {
    const skill = readSkill(STATS_SKILL)

    for (const text of ['candidates', 'para podar', 'podemos el mazo'])
      expect(skill.text).toContain(text)
  })
})
