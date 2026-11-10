import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { runSql } from '../../../../../tests/support/store/store.ts'

const SESSION = '2026-11-11T21:00:00-05:00'
const DUE_TODAY = '2026-11-11T20:00:00.000Z'

let now: Date
let cli: StoreCli

beforeEach(() => {
  now = new Date('2026-11-12T02:00:00.000Z')
  cli = cliOnTempStore({ clock: () => now })
})

function useUniqueIds(): void {
  cli = cliOnTempStore({ clock: () => now, randomIndex: uniqueIdDraw() })
}

function run(argv: string[], stdin = '') {
  return cli.run(argv, stdin)
}

async function addCards(count: number): Promise<string[]> {
  const drafts = Array.from({ length: count }, () => SAMPLE_DRAFT)
  const { stdout } = await run(['card', 'add', '--json'], JSON.stringify(drafts))
  return JSON.parse(stdout).ids
}

async function addDueToday(count: number): Promise<string[]> {
  useUniqueIds()
  const ids = await addCards(count)
  runSql(cli.db, `update cards set state = 'review', due = '${DUE_TODAY}'`)
  return ids
}

async function list(argv: string[]) {
  const { stdout } = await run([...argv, '--json'])
  return JSON.parse(stdout)
}

function idsOf(listed: { cards: { id: string }[] }): string[] {
  return listed.cards.map(({ id }) => id)
}

function arrange(id: string, state: string, due: string): void {
  runSql(cli.db, `update cards set state = '${state}', due = '${due}' where id = '${id}'`)
}

describe('aletheia review due', () => {
  it('001-US2-AS1 review due lists new and due cards, studied first, with their count', async () => {
    await addCards(6)
    arrange('89ab', 'review', '2026-11-11T15:00:00.000Z')
    arrange('cdef', 'review', '2026-11-12T04:59:59.000Z')
    arrange('ghjk', 'review', '2026-11-12T05:00:00.000Z')
    arrange('mnpq', 'learning', '2026-11-12T01:50:00.000Z')

    const { code, stdout } = await run(['review', 'due', '--json'])
    const due = JSON.parse(stdout)

    expect(code).toBe(0)
    expect(due.count).toBe(5)
    expect(due.cards.map(({ id }: { id: string }) => id)).toEqual([
      'mnpq',
      '89ab',
      'cdef',
      '0123',
      '4567',
    ])
    expect(due.cards[0]).toEqual({
      id: 'mnpq',
      type: SAMPLE_DRAFT.type,
      tags: SAMPLE_DRAFT.tags,
      question: SAMPLE_DRAFT.question,
      keyPoints: SAMPLE_DRAFT.keyPoints,
      answer: SAMPLE_DRAFT.answer,
    })
  })

  it('001-US2-AS1 review due prints a new card as the contract shows it', async () => {
    await addCards(1)

    const { code, stdout } = await run(['review', 'due'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        `session: "${SESSION}"`,
        'count: 1',
        'remaining: 0',
        'heldBack: 0',
        'capReached: false',
        'nextDue: null',
        'cards[1]:',
        '  - id: "0123"',
        '    type: command',
        '    tags[1]: "docker::commands"',
        '    question: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?"',
        '    keyPoints[2]: "`ps`: solo en ejecución","`-a`: incluye detenidos"',
        '    answer: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.',
        '',
      ].join('\n'),
    )
  })

  it('001-US2-AS5 with nothing due, review due is empty and names when the next card is due', async () => {
    await addCards(1)
    arrange('0123', 'review', '2026-11-13T15:00:00.000Z')

    const { code, stdout } = await run(['review', 'due'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      `session: "${SESSION}"\ncount: 0\nremaining: 0\nheldBack: 0\ncapReached: false\nnextDue: "2026-11-13T10:00:00-05:00"\ncards: []\n`,
    )
  })

  it('001-US2-AS5 on an empty deck, review due names no next card', async () => {
    const { code, stdout } = await run(['review', 'due'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      `session: "${SESSION}"\ncount: 0\nremaining: 0\nheldBack: 0\ncapReached: false\nnextDue: null\ncards: []\n`,
    )
  })

  it('001-US2-AS4 a card whose step ends within 20 minutes is due when nothing else is', async () => {
    await addCards(1)
    arrange('0123', 'learning', '2026-11-12T02:10:00.000Z')

    const alone = await run(['review', 'due', '--json'])
    await addCards(1)
    const besideNew = await run(['review', 'due', '--json'])

    expect(JSON.parse(alone.stdout)).toMatchObject({ count: 1, cards: [{ id: '0123' }] })
    expect(JSON.parse(besideNew.stdout)).toMatchObject({ count: 1, cards: [{ id: '4567' }] })
  })

  it('003-US2-AS1 review due starts a session and holds 20 of 25 due cards, saying 5 remain', async () => {
    const ids = await addDueToday(25)

    const due = await list(['review', 'due'])

    expect(due).toMatchObject({
      session: SESSION,
      count: 20,
      remaining: 5,
      heldBack: 0,
      capReached: false,
    })
    expect(idsOf(due)).toEqual(ids.slice(0, 20))
  })

  it('review topic applies the session cap too', async () => {
    await addDueToday(25)

    expect(await list(['review', 'topic', 'docker'])).toMatchObject({ count: 20, remaining: 5 })
  })
})
