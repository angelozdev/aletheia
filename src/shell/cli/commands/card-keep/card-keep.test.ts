import { beforeEach, describe, expect, it } from 'vitest'
import { addTagged, reviewed, rowCounts } from '../../../../../tests/support/progress/progress.ts'
import { archiveCard, failed, jsonOf, pruneCli } from '../../../../../tests/support/prune/prune.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'

const KEPT_AT = '2026-11-15T15:00:00-05:00'
const REASON_RULE = '--reason: must be leech, not-useful, outdated-situation or overlapping'
const OVERLAPS_RULE = '--overlaps: goes with --reason overlapping, and only with it'

let cli: StoreCli

beforeEach(() => {
  cli = pruneCli()
})

function keeps() {
  return selectAll(cli.db, 'select card_id, reason, overlaps, kept_at from keeps order by id')
}

async function expectRefused(refusals: [string[], string][]): Promise<void> {
  for (const [argv, error] of refusals) {
    const { code, stdout, stderr } = await cli.run(['card', 'keep', ...argv])

    expect({ code, stdout }).toEqual({ code: 1, stdout: '' })
    expect(stderr).toMatch(new RegExp(`\\nerror: ${RegExp.escape(error)}\\n$`))
  }
}

describe('aletheia card keep', () => {
  it('007-US4-AS1 card keep records the card, the reason, the instant and, for an overlap, the other card', async () => {
    const [card, other] = await addTagged(cli, [['messaging'], ['messaging']])
    failed(cli, card)

    const leech = await jsonOf(cli, ['card', 'keep', card, '--reason', 'leech'])
    const overlap = await jsonOf(cli, [
      'card',
      'keep',
      card,
      '--reason',
      'overlapping',
      '--overlaps',
      other,
    ])

    expect(leech).toEqual({ card, reason: 'leech', overlaps: null, keptAt: KEPT_AT })
    expect(overlap).toEqual({ card, reason: 'overlapping', overlaps: other, keptAt: KEPT_AT })
    expect(keeps()).toEqual([
      { card_id: card, reason: 'leech', overlaps: null, kept_at: '2026-11-15T20:00:00.000Z' },
      {
        card_id: card,
        reason: 'overlapping',
        overlaps: other,
        kept_at: '2026-11-15T20:00:00.000Z',
      },
    ])
  })

  it('007-US4-AS1 card keep refuses an unknown reason, a misplaced --overlaps, a missing or archived card, and records nothing', async () => {
    const [card, other, archived] = await addTagged(cli, [['docker'], ['docker'], ['docker']])
    await archiveCard(cli, { card: archived })
    const before = rowCounts(cli.db)
    const refusals: [string[], string][] = [
      [[card], 'invalid options: --reason: is required'],
      [[card, '--reason', 'mastered'], `invalid options: ${REASON_RULE}`],
      [[card, '--reason', 'overlapping'], `invalid options: ${OVERLAPS_RULE}`],
      [[card, '--reason', 'leech', '--overlaps', other], `invalid options: ${OVERLAPS_RULE}`],
      [
        [card, '--reason', 'overlapping', '--overlaps', card],
        'invalid options: --overlaps: must be another card',
      ],
      [['zzzz', '--reason', 'leech'], 'card "zzzz" not found'],
      [[archived, '--reason', 'leech'], `card "${archived}" is archived`],
      [[card, '--reason', 'overlapping', '--overlaps', archived], `card "${archived}" is archived`],
    ]

    await expectRefused(refusals)
    expect(keeps()).toEqual([])
    expect(rowCounts(cli.db)).toEqual(before)
  })

  it('007-US4-AS1 card keep refuses a leech or not-useful keep for a card that is not that candidate, or no longer is once kept, and records nothing more', async () => {
    const [card, leech, useless] = await addTagged(cli, [['docker'], ['docker'], ['docker']])
    failed(cli, leech)
    reviewed(cli.db, useless, '2026-11-09T15:00:00.000Z', { flag: 'not-useful' })
    await cli.run(['card', 'keep', leech, '--reason', 'leech'])
    const refusals: [string[], string][] = [
      [[card, '--reason', 'leech'], `card "${card}" is not a leech candidate`],
      [[card, '--reason', 'not-useful'], `card "${card}" is not a not-useful candidate`],
      [[useless, '--reason', 'leech'], `card "${useless}" is not a leech candidate`],
      [[leech, '--reason', 'leech'], `card "${leech}" is not a leech candidate`],
    ]

    await expectRefused(refusals)
    expect(keeps()).toMatchObject([{ card_id: leech, reason: 'leech' }])
    expect(keeps()).toHaveLength(1)
  })

  it('card keep prints the keep as TOON', async () => {
    const [card, other] = await addTagged(cli, [['docker'], ['docker']])

    const { stdout } = await cli.run([
      'card',
      'keep',
      card,
      '--reason',
      'overlapping',
      '--overlaps',
      other,
    ])

    expect(stdout).toBe(
      [
        `card: "${card}"`,
        'reason: overlapping',
        `overlaps: "${other}"`,
        `keptAt: "${KEPT_AT}"`,
        '',
      ].join('\n'),
    )
  })
})
