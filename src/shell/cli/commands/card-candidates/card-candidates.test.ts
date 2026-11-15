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
})
