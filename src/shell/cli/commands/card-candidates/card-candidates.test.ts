import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { addTagged, reviewed, rowCounts } from '../../../../../tests/support/progress/progress.ts'
import { LAST_OF_THREE_FAILURES } from '../../../../../tests/support/prune/prune.constants.ts'
import { archiveCard, failed, jsonOf, pruneCli } from '../../../../../tests/support/prune/prune.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

let cli: StoreCli

beforeEach(() => {
  cli = pruneCli()
})

function leechRow(id: string, tags: string[]) {
  return {
    id,
    question: SAMPLE_DRAFT.question,
    tags,
    reasons: ['leech'],
    failures: 3,
    lastFailure: LAST_OF_THREE_FAILURES,
    notUseful: null,
  }
}

describe('aletheia card candidates', () => {
  it('007-US1-AS1 card candidates gives each leech of the deck or under the tags, with id, question, tags, reasons and evidence', async () => {
    const [rabbit, docker, passing, archived] = await addTagged(cli, [
      ['messaging::rabbitmq'],
      ['docker'],
      ['messaging'],
      ['messaging'],
    ])
    for (const id of [rabbit, docker, archived]) failed(cli, id)
    failed(cli, passing, 2)
    reviewed(cli.db, passing, '2026-11-10T15:00:00.000Z')
    await archiveCard(cli, { card: archived })
    const before = rowCounts(cli.db)

    const deck = await jsonOf(cli, ['card', 'candidates'])
    const messaging = await jsonOf(cli, ['card', 'candidates', 'messaging'])
    const uncovered = await cli.run(['card', 'candidates', 'kafka'])

    expect(deck).toEqual({
      candidates: [leechRow(rabbit, ['messaging::rabbitmq']), leechRow(docker, ['docker'])],
      kept: [],
    })
    expect(messaging).toEqual({ candidates: [leechRow(rabbit, ['messaging::rabbitmq'])], kept: [] })
    expect(uncovered).toMatchObject({ code: 1, stdout: '' })
    expect(uncovered.stderr).toMatch(/\nerror: no active card under kafka\n$/)
    expect(rowCounts(cli.db)).toEqual(before)
  })

  it('007-US2-AS2 card candidates gives a card said to be useless, with the instant and rationale of its latest not-useful review', async () => {
    const [useless, useful] = await addTagged(cli, [['docker'], ['docker']])
    const rationale = 'Dijo: "esto no me sirve, nunca lo uso". Cubre los dos puntos.'
    reviewed(cli.db, useless, '2026-11-02T15:00:00.000Z', { flag: 'not-useful' })
    reviewed(cli.db, useless, '2026-11-09T15:00:00.000Z', { flag: 'not-useful', rationale })
    reviewed(cli.db, useful, '2026-11-09T15:00:00.000Z')

    const { candidates } = await jsonOf(cli, ['card', 'candidates'])

    expect(candidates).toEqual([
      {
        id: useless,
        question: SAMPLE_DRAFT.question,
        tags: ['docker'],
        reasons: ['not-useful'],
        failures: 0,
        lastFailure: null,
        notUseful: { at: '2026-11-09T10:00:00-05:00', rationale },
      },
    ])
  })

  it('007-US4-AS2 card candidates leaves a kept leech out until a later failure, a kept not-useful for the keep months, and lists the recent keeps', async () => {
    const [leech, useless, other] = await addTagged(cli, [['docker'], ['docker'], ['docker']])
    failed(cli, leech)
    reviewed(cli.db, useless, '2026-11-09T15:00:00.000Z', { flag: 'not-useful' })
    await cli.run(['card', 'keep', leech, '--reason', 'leech'])
    await cli.run(['card', 'keep', useless, '--reason', 'not-useful'])
    await cli.run(['card', 'keep', other, '--reason', 'overlapping', '--overlaps', leech])

    const whileKept = await jsonOf(cli, ['card', 'candidates'])
    reviewed(cli.db, leech, '2026-11-15T21:00:00.000Z', { grade: 'again' })
    const afterFailure = await jsonOf(cli, ['card', 'candidates'])

    const keptAt = '2026-11-15T15:00:00-05:00'
    expect(whileKept).toEqual({
      candidates: [],
      kept: [
        { card: other, reason: 'overlapping', overlaps: leech, keptAt },
        { card: useless, reason: 'not-useful', overlaps: null, keptAt },
        { card: leech, reason: 'leech', overlaps: null, keptAt },
      ],
    })
    expect(afterFailure.candidates).toMatchObject([{ id: leech, reasons: ['leech'], failures: 4 }])
  })

  it('card candidates prints the candidates and the keeps as TOON', async () => {
    const [leech, useless, other] = await addTagged(cli, [
      ['messaging::redis-streams'],
      ['docker'],
      ['docker'],
    ])
    failed(cli, leech)
    reviewed(cli.db, useless, '2026-11-09T15:00:00.000Z', {
      flag: 'not-useful',
      rationale: 'Dijo: "esto no me sirve". Cubre los dos puntos.',
    })
    await cli.run(['card', 'keep', other, '--reason', 'overlapping', '--overlaps', useless])

    const { stdout } = await cli.run(['card', 'candidates'])

    expect(stdout).toBe(
      [
        'candidates[2]:',
        `  - id: "${leech}"`,
        `    question: "${SAMPLE_DRAFT.question}"`,
        '    tags[1]: "messaging::redis-streams"',
        '    reasons[1]: leech',
        '    failures: 3',
        `    lastFailure: "${LAST_OF_THREE_FAILURES}"`,
        '    notUseful: null',
        `  - id: "${useless}"`,
        `    question: "${SAMPLE_DRAFT.question}"`,
        '    tags[1]: docker',
        '    reasons[1]: not-useful',
        '    failures: 0',
        '    lastFailure: null',
        '    notUseful:',
        '      at: "2026-11-09T10:00:00-05:00"',
        '      rationale: "Dijo: \\"esto no me sirve\\". Cubre los dos puntos."',
        'kept[1]{card,reason,overlaps,keptAt}:',
        `  "${other}",overlapping,"${useless}","2026-11-15T15:00:00-05:00"`,
        '',
      ].join('\n'),
    )
  })
})
