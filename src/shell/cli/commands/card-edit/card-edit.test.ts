import { beforeEach, describe, expect, it } from 'vitest'
import { ASKED, SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'

const T0 = '2026-11-09T15:00:00.000Z'
const T1 = '2026-11-10T15:00:00.000Z'
const NEW_QUESTION = 'En Docker, ¿qué contenedores lista `docker ps` y cuáles añade `docker ps -a`?'

const GOOD = {
  card: '0123',
  grade: 'good',
  claudeGrade: 'good',
  answer: 'ps muestra los que corren, -a todos',
  rationale: 'Cubre los dos key points.',
  askedQuestion: ASKED,
}

let now: Date
let cli: StoreCli

beforeEach(async () => {
  now = new Date(T0)
  cli = cliOnTempStore({ clock: () => now })
  await cli.run(['card', 'add'], JSON.stringify([SAMPLE_DRAFT]))
  await cli.run(['review', 'grade'], JSON.stringify(GOOD))
  now = new Date(T1)
})

async function listed(argv: string[]) {
  const { stdout } = await cli.run([...argv, '--json'])
  return JSON.parse(stdout)
}

function shownCard() {
  return listed(['card', 'show', '0123'])
}

async function search(words: string) {
  const { stdout } = await cli.run(['card', 'search', '--json'], JSON.stringify({ words }))
  return JSON.parse(stdout)
}

function edit(fields: Record<string, unknown>) {
  return cli.run(['card', 'edit', '--json'], JSON.stringify({ card: '0123', ...fields }))
}

describe('aletheia card edit', () => {
  it('004-US3-AS1 card edit changes the fields given and keeps the id, source, schedule and reviews', async () => {
    const before = await shownCard()
    const tags = ['docker::containers']

    const { code, stdout } = await edit({ question: NEW_QUESTION, tags })
    const topic = await listed(['review', 'topic', 'docker::containers'])

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      ...before,
      question: NEW_QUESTION,
      tags,
      updatedAt: '2026-11-10T10:00:00-05:00',
    })
    expect(await shownCard()).toEqual(JSON.parse(stdout))
    expect(selectAll(cli.db, 'select count(*) as n from reviews')).toEqual([{ n: 1 }])
    expect(topic.cards).toMatchObject([{ id: '0123' }])
  })

  it.for<[Record<string, unknown>, string]>([
    [{ keyPoints: [] }, 'invalid edit: keyPoints: must have 1 to 3 items'],
    [
      { tags: ['Docker'] },
      'invalid edit: tags[0]: use a-z, digits and dashes, in segments joined by ::',
    ],
    [
      { type: 'essay' },
      'invalid edit: type: must be concept, comparison, command, scenario or code',
    ],
    [{ question: ' ' }, 'invalid edit: question: is required'],
    [{ source: 'x' }, 'invalid edit: source: is not an edit field'],
    [{ due: 'x' }, 'invalid edit: due: is not an edit field'],
    [{}, 'invalid edit: give a field to change'],
    [{ card: 'zzzz', question: 'q' }, 'card "zzzz" not found'],
  ])(
    '004-US3-AS2 card edit refuses a broken rule, nothing to change, a field that cannot change or an unknown card, and changes nothing',
    async ([fields, error]) => {
      const before = await shownCard()

      const { code, stdout, stderr } = await edit(fields)

      expect(code).toBe(1)
      expect(stdout).toBe('')
      expect(stderr).toMatch(new RegExp(`\\nerror: ${RegExp.escape(error)}\\n$`))
      expect(await shownCard()).toEqual(before)
    },
  )

  it('004-US3-AS3 a card edited is found by a word of its new text and no longer by a word only in its old one', async () => {
    await edit({ question: NEW_QUESTION })

    const byNewWord = await search('añade')
    const byOldWord = await search('diferencia')

    expect(byNewWord.cards).toMatchObject([{ id: '0123' }])
    expect(byOldWord.cards).toEqual([])
  })
})
