import { basename, dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALETHEIA_SKILLS, DEVELOPMENT_ONLY } from '../support/skills/skills.constants.ts'
import {
  readSkill,
  refusedCommands,
  triggersOf,
  unknownCommands,
} from '../support/skills/skills.ts'

const REFUSED_FOR_INPUT = [
  '```sh',
  "aletheia review grade <<'JSON'",
  '{"card":"k7m2","grade":"Good"}',
  'JSON',
  '```',
  '',
  '  ```sh',
  '  aletheia card frob',
  '  ```',
].join('\n')

const REFUSED_FOR_EMPTY_DECK = [
  '```sh',
  'aletheia card show k7m2',
  'aletheia card list <tags> --content',
  '```',
].join('\n')

describe('the commands a skill shows', () => {
  it('reports one the CLI refuses for its input, and one it does not know', async () => {
    const refused = await refusedCommands(REFUSED_FOR_INPUT)

    expect(refused).toEqual([
      expect.stringMatching(/^aletheia review grade: error: /),
      expect.stringMatching(/^aletheia card frob: error: unknown command/),
    ])
  })

  it('accepts one refused only because the deck is empty', async () => {
    const refused = await refusedCommands(REFUSED_FOR_EMPTY_DECK)

    expect(refused).toEqual([])
  })

  it('reports a command named in the text that the CLI does not know', async () => {
    const unknown = await unknownCommands(
      'Run `aletheia card frob`, then `aletheia card show <id>`.',
    )

    expect(unknown).toEqual(['aletheia card frob'])
  })
})

describe('the Aletheia skills', () => {
  it.for(ALETHEIA_SKILLS)('every command %s shows is one the CLI accepts', async (path) => {
    const { text } = readSkill(path)

    const refused = await refusedCommands(text)

    expect(refused).toEqual([])
  })

  it.for(ALETHEIA_SKILLS)('every command %s names is one the CLI knows', async (path) => {
    const { text } = readSkill(path)

    const unknown = await unknownCommands(text)

    expect(unknown).toEqual([])
  })

  it.for(ALETHEIA_SKILLS)(
    '%s is named after its folder and calls the installed aletheia',
    (path) => {
      const skill = readSkill(path)
      const folder = dirname(path)

      expect(skill.name).toBe(basename(folder))
      for (const forbidden of DEVELOPMENT_ONLY) expect(skill.text).not.toContain(forbidden)
    },
  )

  it.for(ALETHEIA_SKILLS)('%s has triggers no other skill carries', (path) => {
    const skill = readSkill(path)
    const others = ALETHEIA_SKILLS.filter((other) => other !== path).map(readSkill)
    const triggers = triggersOf(skill.description)

    expect(triggers.length).toBeGreaterThan(0)
    for (const trigger of triggers)
      for (const other of others) expect(other.description).not.toContain(trigger)
  })
})
