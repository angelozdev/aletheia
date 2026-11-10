import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { FIXED_INSTANT } from '../../../../../tests/support/run-cli/run-cli.constants.ts'
import { runOnStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { CliRun } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../../tests/support/temp-dir/temp-dir.ts'

let db: string

beforeEach(() => {
  db = join(tempDir('aletheia-cli-'), 'store.sqlite')
})

function cardAddText(stdin: string, argv: string[] = []) {
  return runOnStore(db, ['card', 'add', ...argv], stdin)
}

function cardAdd(cards: unknown, argv: string[] = []) {
  return cardAddText(JSON.stringify(cards), argv)
}

function cardWithout(field: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(SAMPLE_DRAFT).filter(([key]) => key !== field))
}

function storedCards(): unknown {
  return selectAll(db, 'select count(*) as n from cards')
}

function expectRefused({ code, stdout, stderr }: CliRun, error: string): void {
  const expected = `error: ${error}\n`
  expect(code).toBe(1)
  expect(stdout).toBe('')
  expect(stderr.slice(-expected.length)).toBe(expected)
  expect(storedCards()).toEqual([{ n: 0 }])
}

const TAG_MESSAGE = 'tags[0]: use a-z, digits and dashes, in segments joined by ::'

const FOUR_KEY_POINTS = ['uno', 'dos', 'tres', 'cuatro']

describe('aletheia card add', () => {
  it('001-US1-AS1 card add stores a valid card active and new, due now, and prints its id', async () => {
    const { code, stdout, stderr } = await cardAdd([SAMPLE_DRAFT])

    expect(code).toBe(0)
    expect(stdout).toBe('ids[1]: "0123"\n')
    expect(stderr.startsWith(`env: custom (${db})\n`)).toBe(true)
    expect(
      selectAll(db, 'select id, status, state, due, created_at, updated_at from cards'),
    ).toEqual([
      {
        id: '0123',
        status: 'active',
        state: 'new',
        due: FIXED_INSTANT,
        created_at: FIXED_INSTANT,
        updated_at: FIXED_INSTANT,
      },
    ])
    expect(selectAll(db, 'select tag from card_tags')).toEqual([{ tag: 'docker::commands' }])
  })

  it('001-US1-AS1 --json prints the ids as JSON', async () => {
    const { code, stdout } = await cardAdd([SAMPLE_DRAFT], ['--json'])

    expect(code).toBe(0)
    expect(stdout).toBe('{"ids":["0123"]}\n')
  })

  it.for<[string, unknown, string]>([
    ['no situation', cardWithout('situation'), 'situation: is required'],
    ['a blank answer', { ...SAMPLE_DRAFT, answer: '  ' }, 'answer: is required'],
    ['no key points', { ...SAMPLE_DRAFT, keyPoints: [] }, 'keyPoints: must have 1 to 3 items'],
    [
      'four key points',
      { ...SAMPLE_DRAFT, keyPoints: FOUR_KEY_POINTS },
      'keyPoints: must have 1 to 3 items',
    ],
    [
      'a blank second key point',
      { ...SAMPLE_DRAFT, keyPoints: ['uno', ' '] },
      'keyPoints[1]: is required',
    ],
    [
      'an unknown type',
      { ...SAMPLE_DRAFT, type: 'cloze' },
      'type: must be concept, comparison, command, scenario or code',
    ],
    ['no tags', { ...SAMPLE_DRAFT, tags: [] }, 'tags: must have at least one tag'],
    ['the tag Docker', { ...SAMPLE_DRAFT, tags: ['Docker'] }, TAG_MESSAGE],
    ['the tag mensajería', { ...SAMPLE_DRAFT, tags: ['mensajería'] }, TAG_MESSAGE],
    ['the tag docker:commands', { ...SAMPLE_DRAFT, tags: ['docker:commands'] }, TAG_MESSAGE],
    ['the tag docker::', { ...SAMPLE_DRAFT, tags: ['docker::'] }, TAG_MESSAGE],
    ['the tag -docker', { ...SAMPLE_DRAFT, tags: ['-docker'] }, TAG_MESSAGE],
    ['the same tag twice', { ...SAMPLE_DRAFT, tags: ['docker', 'docker'] }, 'tags[1]: is repeated'],
    [
      'a field that is not a card field',
      { ...SAMPLE_DRAFT, keypoints: ['uno'] },
      'keypoints: is not a card field',
    ],
    [
      'no situation and four key points, in the order of the field table',
      { ...cardWithout('situation'), keyPoints: FOUR_KEY_POINTS },
      'situation: is required; keyPoints: must have 1 to 3 items',
    ],
  ])('001-US1-AS2 card add refuses %s', async ([, card, message]) => {
    expectRefused(await cardAdd([card]), `card 1: ${message}`)
  })

  it('001-US1-AS3 one invalid card among several stores none', async () => {
    const run = await cardAdd([SAMPLE_DRAFT, cardWithout('situation'), SAMPLE_DRAFT])

    expectRefused(run, 'card 2: situation: is required')
  })

  it('001-US1-AS3 each invalid card is named by its position, cards joined by |', async () => {
    const run = await cardAdd([
      cardWithout('situation'),
      SAMPLE_DRAFT,
      { ...SAMPLE_DRAFT, tags: [] },
    ])

    expectRefused(run, 'card 1: situation: is required | card 3: tags: must have at least one tag')
  })

  it.for([
    ['malformed JSON', 'not json'],
    ['malformed JSON over several lines, on one error line', 'not\njson\n'],
    ['an empty stdin', ''],
  ])('card add refuses %s', async ([, stdin]) => {
    const { code, stdout, stderr } = await cardAddText(stdin)

    expect(code).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toMatch(/\nerror: invalid JSON on stdin: [^\n]+\n$/)
    expect(storedCards()).toEqual([{ n: 0 }])
  })

  it.for(['{}', '[]'])('card add refuses anything but a list of cards: %s', async (stdin) => {
    expectRefused(await cardAddText(stdin), 'expected a list of one or more cards')
  })
})
