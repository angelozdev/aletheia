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
})
