import { beforeEach, describe, expect, it } from 'vitest'
import { addTagged, rowCounts } from '../../../../../tests/support/progress/progress.ts'
import { ARCHIVE_REASON } from '../../../../../tests/support/prune/prune.constants.ts'
import {
  archiveCard,
  jsonOf,
  listedIds,
  pruneCli,
} from '../../../../../tests/support/prune/prune.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'

const SECOND_REASON = 'ahora sí, ya no la uso'

let cli: StoreCli

beforeEach(() => {
  cli = pruneCli()
})

function statusChanges() {
  return selectAll(cli.db, 'select status, reason from card_status_history order by id')
}

describe('aletheia card restore', () => {
  it('007-US1-AS3 card restore makes an archived card active with the schedule it had, back in every view', async () => {
    const [id] = await addTagged(cli, [['docker']])
    const before = await jsonOf(cli, ['card', 'show', id])
    await archiveCard(cli, { card: id })

    const { code, stdout } = await cli.run(['card', 'restore', id, '--json'])

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toEqual(before)
    expect(await listedIds(cli, ['card', 'list'])).toEqual([id])
    expect(await listedIds(cli, ['review', 'due'])).toEqual([id])
  })

  it('007-US1-AS3 card restore refuses an active card or a missing one, and writes nothing', async () => {
    const [id] = await addTagged(cli, [['docker']])
    const before = { rows: rowCounts(cli.db), statusChanges: statusChanges() }
    const refusals: [string, string][] = [
      [id, `card "${id}" is not archived`],
      ['zzzz', 'card "zzzz" not found'],
    ]

    for (const [card, error] of refusals) {
      const { code, stdout, stderr } = await cli.run(['card', 'restore', card])

      expect({ code, stdout }).toEqual({ code: 1, stdout: '' })
      expect(stderr).toMatch(new RegExp(`\\nerror: ${RegExp.escape(error)}\\n$`))
    }
    expect({ rows: rowCounts(cli.db), statusChanges: statusChanges() }).toEqual(before)
  })

  it('a card archived, restored and archived again shows its second reason and keeps every change', async () => {
    const [id] = await addTagged(cli, [['docker']])
    await archiveCard(cli, { card: id })
    await cli.run(['card', 'restore', id])
    await archiveCard(cli, { card: id, reason: SECOND_REASON })

    expect(await jsonOf(cli, ['card', 'show', id])).toMatchObject({
      status: 'archived',
      archiveReason: SECOND_REASON,
    })
    expect(statusChanges()).toEqual([
      { status: 'archived', reason: ARCHIVE_REASON },
      { status: 'active', reason: null },
      { status: 'archived', reason: SECOND_REASON },
    ])
  })
})
