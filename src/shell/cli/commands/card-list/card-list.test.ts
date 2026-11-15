import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import {
  addTagged,
  reviewed,
  rowCounts,
  studied,
} from '../../../../../tests/support/progress/progress.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import { runSql } from '../../../../../tests/support/store/store.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

const NOW = new Date('2026-11-15T20:00:00.000Z')
const GAP = { grade: 'again', flag: 'missing-prerequisite' }

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore({ clock: () => NOW, randomIndex: uniqueIdDraw() })
})

async function list(argv: string[] = []) {
  const { stdout } = await cli.run(['card', 'list', ...argv, '--json'])
  return JSON.parse(stdout)
}

function failed(id: string): void {
  for (const day of ['01', '03', '05', '07'])
    reviewed(cli.db, id, `2026-11-${day}T15:00:00.000Z`, { grade: 'again' })
}

describe('aletheia card list', () => {
  it('006-US2-AS1 card list gives the cards under a tag matching every filter, with id, question, tags, state, due, last review, failures and gaps', async () => {
    const [both, weak, , outside] = await addTagged(cli, [
      ['messaging'],
      ['messaging'],
      ['messaging'],
      ['docker'],
    ])
    for (const id of [both, weak, outside]) failed(id)
    for (const id of [both, outside]) reviewed(cli.db, id, '2026-11-12T15:00:00.000Z', GAP)
    studied(cli.db, both, 'relearning', '2026-11-15T23:00:00.000Z')
    const before = rowCounts(cli.db)

    const listed = await list(['messaging', '--weak', '--gaps'])

    expect(listed).toEqual({
      cards: [
        {
          id: both,
          question: SAMPLE_DRAFT.question,
          tags: ['messaging'],
          state: 'relearning',
          due: '2026-11-15T18:00:00-05:00',
          lastReview: '2026-11-12T10:00:00-05:00',
          failures: 4,
          gaps: 1,
          weak: true,
        },
      ],
    })
    expect(rowCounts(cli.db)).toEqual(before)
  })

  it('006-US2-AS1 card list --not-reviewed 30 gives the cards with no review in the last 30 days', async () => {
    const [stale, recent] = await addTagged(cli, [['messaging'], ['messaging'], ['messaging']])
    reviewed(cli.db, stale, '2026-10-01T15:00:00.000Z')
    reviewed(cli.db, recent, '2026-11-01T15:00:00.000Z')

    expect(await list(['--not-reviewed', '30'])).toMatchObject({
      cards: [{ id: stale, lastReview: '2026-10-01T10:00:00-05:00' }],
    })
  })

  it('006-US2-AS2 card list --not-reviewed gives a card never reviewed when it was saved before the window', async () => {
    const [savedEarly] = await addTagged(cli, [['messaging'], ['messaging']])
    runSql(
      cli.db,
      `update cards set created_at = '2026-10-01T15:00:00.000Z' where id = '${savedEarly}'`,
    )

    expect(await list(['--not-reviewed', '30'])).toEqual({
      cards: [expect.objectContaining({ id: savedEarly, lastReview: null })],
    })
  })

  it.for(['0', 'x'])('card list --not-reviewed %s exits 1 naming the rule', async (days) => {
    const { code, stdout, stderr } = await cli.run(['card', 'list', '--not-reviewed', days])

    expect(code).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toMatch(
      /error: invalid options: --not-reviewed: must be a whole number, 1 or more\n$/,
    )
  })

  it('006-US2-AS3 card list sorts by a field in either direction', async () => {
    const [once, thrice, fresh] = await addTagged(cli, [
      ['messaging'],
      ['messaging'],
      ['messaging'],
    ])
    reviewed(cli.db, once, '2026-11-01T15:00:00.000Z', { grade: 'again' })
    for (const day of ['02', '04', '06'])
      reviewed(cli.db, thrice, `2026-11-${day}T15:00:00.000Z`, { grade: 'again' })
    studied(cli.db, once, 'review', '2026-11-20T15:00:00.000Z')
    studied(cli.db, thrice, 'relearning', '2026-11-16T15:00:00.000Z')
    const idsOf = ({ cards }: { cards: { id: string }[] }) => cards.map(({ id }) => id)

    const byFailures = await list(['--sort', 'failures', '--desc'])
    const byDue = await list(['--sort', 'due'])

    expect(idsOf(byFailures)).toEqual([thrice, once, fresh])
    expect(idsOf(byDue)).toEqual([fresh, thrice, once])
  })

  it('006-US2-AS3 card list refuses an unknown sort field naming the valid ones', async () => {
    const { code, stdout, stderr } = await cli.run(['card', 'list', '--sort', 'nope'])

    expect(code).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toMatch(
      /error: invalid options: --sort: must be id, state, due, lastReview, failures or gaps\n$/,
    )
  })

  it('card list prints the cards as TOON', async () => {
    const [seen] = await addTagged(cli, [['messaging'], ['messaging::rabbitmq']])
    studied(cli.db, seen, 'review', '2026-11-15T23:00:00.000Z')
    reviewed(cli.db, seen, '2026-11-10T15:00:00.000Z')

    const { code, stdout } = await cli.run(['card', 'list'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'cards[2]:',
        '  - id: "0000"',
        `    question: "${SAMPLE_DRAFT.question}"`,
        '    tags[1]: messaging',
        '    state: review',
        '    due: "2026-11-15T18:00:00-05:00"',
        '    lastReview: "2026-11-10T10:00:00-05:00"',
        '    failures: 0',
        '    gaps: 0',
        '    weak: false',
        '  - id: "0001"',
        `    question: "${SAMPLE_DRAFT.question}"`,
        '    tags[1]: "messaging::rabbitmq"',
        '    state: new',
        '    due: "2026-11-15T15:00:00-05:00"',
        '    lastReview: null',
        '    failures: 0',
        '    gaps: 0',
        '    weak: false',
        '',
      ].join('\n'),
    )
  })

  it('007-US3-AS1 card list --content gives each card under a tag with its id, question, key points and situation', async () => {
    const [messaging] = await addTagged(cli, [['messaging::rabbitmq'], ['docker']])

    const withContent = await list(['messaging', '--content'])
    const plain = await list(['messaging'])

    expect(withContent.cards).toEqual([
      {
        ...plain.cards[0],
        keyPoints: SAMPLE_DRAFT.keyPoints,
        situation: SAMPLE_DRAFT.situation,
      },
    ])
    expect(plain.cards).toMatchObject([{ id: messaging, question: SAMPLE_DRAFT.question }])
    expect(plain.cards[0]).not.toHaveProperty('keyPoints')
  })
})
