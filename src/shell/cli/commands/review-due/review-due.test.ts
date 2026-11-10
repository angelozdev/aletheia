import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { insertSql, runSql } from '../../../../../tests/support/store/store.ts'

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

function gradedAt(ids: string[], reviewedAt: string, stateBefore = 'review'): void {
  for (const id of ids) {
    const review = {
      card_id: id,
      grade: 'good',
      claude_grade: 'good',
      state_before: stateBefore,
      reviewed_at: reviewedAt,
      answer: 'a',
      rationale: 'r',
    }
    runSql(cli.db, insertSql('reviews', review))
  }
}

async function atTheCap(): Promise<string[]> {
  const ids = await addDueToday(25)
  const graded = ids.slice(0, 20)
  gradedAt(graded, '2026-11-12T01:30:00.000Z')
  for (const id of graded.slice(1)) arrange(id, 'review', '2026-11-20T15:00:00.000Z')
  arrange(graded[0], 'relearning', '2026-11-12T01:40:00.000Z')
  return ids
}

async function addIntroducedToday(introduced: number, fresh: number): Promise<string[]> {
  useUniqueIds()
  const ids = await addCards(introduced + fresh)
  const introducedIds = ids.slice(0, introduced)
  gradedAt(introducedIds, '2026-11-11T15:00:00.000Z', 'new')
  for (const id of introducedIds) arrange(id, 'review', '2026-11-14T15:00:00.000Z')
  return ids.slice(introduced)
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

  it('003-US2-AS2 at the cap, review due holds only the card graded Again and due again, and says the cap is reached with 5 remaining', async () => {
    const ids = await atTheCap()

    const due = await list(['review', 'due', '--session', '2026-11-11T20:25:00-05:00'])

    expect(idsOf(due)).toEqual([ids[0]])
    expect(due).toMatchObject({ capReached: true, remaining: 5 })
  })

  it('003-US2-AS3 going on at the cap starts a new round of at most 20', async () => {
    const ids = await atTheCap()
    arrange(ids[0], 'review', '2026-11-20T15:00:00.000Z')

    const goingOn = await list(['review', 'due'])
    await addCards(20)
    runSql(cli.db, `update cards set state = 'review', due = '${DUE_TODAY}' where state = 'new'`)
    const newRound = await list(['review', 'due'])

    expect(idsOf(goingOn)).toEqual(ids.slice(20))
    expect(goingOn).toMatchObject({ capReached: false, remaining: 0 })
    expect(newRound).toMatchObject({ count: 20, remaining: 5, capReached: false })
  })

  it('review due refuses a malformed or future --session', async () => {
    const malformed = await run(['review', 'due', '--session', 'yesterday'])
    const future = await run(['review', 'due', '--session', '2026-11-11T21:01:00-05:00'])

    expect(malformed).toMatchObject({ code: 1, stdout: '' })
    expect(malformed.stderr).toMatch(
      /error: invalid options: --session: must be an instant with its offset, like 2026-11-10T10:00:00-05:00\n$/,
    )
    expect(future).toMatchObject({ code: 1, stdout: '' })
    expect(future.stderr).toMatch(/error: invalid options: --session: is in the future\n$/)
  })

  it('003-US2-AS4 a session of 10 holds 10 of 25 and the next session holds 20 again', async () => {
    await addDueToday(25)

    const ofTen = await list(['review', 'due', '--session-size', '10'])
    const next = await list(['review', 'due'])

    expect(ofTen).toMatchObject({ count: 10, remaining: 15 })
    expect(next).toMatchObject({ count: 20, remaining: 5 })
  })

  it.for(['0', '-1', '1.5', 'ten'])(
    'review due refuses a session size below 1: %s',
    async (size) => {
      const refused = await run(['review', 'due', '--session-size', size])

      expect(refused).toMatchObject({ code: 1, stdout: '' })
      expect(refused.stderr).toMatch(
        /error: invalid options: --session-size: must be a whole number, 1 or more\n$/,
      )
    },
  )

  it('003-US3-AS1 review due introduces the 10 new cards saved first and holds 5 back until tomorrow', async () => {
    useUniqueIds()
    const ids = await addCards(15)

    const due = await list(['review', 'due'])

    expect(idsOf(due)).toEqual(ids.slice(0, 10))
    expect(due).toMatchObject({ count: 10, heldBack: 5, remaining: 0 })
  })

  it('003-US3-AS2 new cards first graded today count, in any review, and the next local day starts at 10 again', async () => {
    await addIntroducedToday(4, 10)

    const today = await list(['review', 'due'])
    now = new Date('2026-11-13T02:00:00.000Z')
    const nextDay = await list(['review', 'due'])

    expect(today).toMatchObject({ count: 6, heldBack: 4 })
    expect(nextDay).toMatchObject({ count: 10, heldBack: 0 })
  })

  it('nothing due but new cards held back: the list is empty, says how many wait and names tomorrow', async () => {
    await addIntroducedToday(10, 3)

    expect(await list(['review', 'due'])).toMatchObject({
      count: 0,
      heldBack: 3,
      nextDue: '2026-11-12T00:00:00-05:00',
    })
  })

  it('003-US3-AS4 asking for 20 new today, with 4 introduced, holds at most 16; the next session is back to 10 a day', async () => {
    await addIntroducedToday(4, 30)

    const asked = await list(['review', 'due', '--new-per-day', '20'])
    const next = await list(['review', 'due'])

    expect(asked).toMatchObject({ count: 16, heldBack: 14 })
    expect(next).toMatchObject({ count: 6, heldBack: 24 })
  })

  it('review due refuses a daily limit below 0', async () => {
    const refused = await run(['review', 'due', '--new-per-day', '-1'])

    expect(refused).toMatchObject({ code: 1, stdout: '' })
    expect(refused.stderr).toMatch(
      /error: invalid options: --new-per-day: must be a whole number, 0 or more\n$/,
    )
  })
})
