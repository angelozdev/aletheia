import { beforeEach, describe, expect, it } from 'vitest'
import { addTagged, reviewed, rowCounts } from '../../../../../tests/support/progress/progress.ts'
import { ARCHIVE_REASON } from '../../../../../tests/support/prune/prune.constants.ts'
import {
  archiveCard,
  jsonOf,
  listedIds,
  pruneCli,
} from '../../../../../tests/support/prune/prune.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'

let cli: StoreCli

beforeEach(() => {
  cli = pruneCli()
})

function stored(id: string) {
  return {
    rows: rowCounts(cli.db),
    statusChanges: selectAll(cli.db, 'select * from card_status_history order by id'),
    card: selectAll(cli.db, `select * from cards where id = '${id}'`),
  }
}

describe('aletheia card archive', () => {
  it('007-US1-AS2 card archive archives an active card with its reason and instant, keeping its schedule and reviews', async () => {
    const [id] = await addTagged(cli, [['docker']])
    reviewed(cli.db, id, '2026-11-10T15:00:00.000Z')
    const before = await jsonOf(cli, ['card', 'show', id])

    const { code, stdout } = await archiveCard(cli, { card: id }, ['--json'])

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      ...before,
      status: 'archived',
      archivedAt: '2026-11-15T15:00:00-05:00',
      archiveReason: ARCHIVE_REASON,
    })
    expect(await jsonOf(cli, ['card', 'show', id])).toEqual(JSON.parse(stdout))
    expect(rowCounts(cli.db).reviews).toBe(1)
  })

  it('007-US1-AS2 card archive refuses a blank reason, an unknown field, a missing card or an archived one, and changes nothing', async () => {
    const [active, archived] = await addTagged(cli, [['docker'], ['docker']])
    await archiveCard(cli, { card: archived })
    const before = stored(active)
    const refusals: [Record<string, unknown>, string][] = [
      [{ card: active, reason: '  ' }, 'invalid archive: reason: is required'],
      [{ card: active, reason: undefined }, 'invalid archive: reason: is required'],
      [{ card: active, due: 'x' }, 'invalid archive: due: is not an archive field'],
      [{ card: 'zzzz' }, 'card "zzzz" not found'],
      [{ card: archived }, `card "${archived}" is archived`],
    ]

    for (const [fields, error] of refusals) {
      const { code, stdout, stderr } = await archiveCard(cli, fields)

      expect({ code, stdout }).toEqual({ code: 1, stdout: '' })
      expect(stderr).toMatch(new RegExp(`\\nerror: ${RegExp.escape(error)}\\n$`))
    }
    expect(stored(active)).toEqual(before)
  })

  it('007-US1-AS2 an archived card leaves review due, review topic, card list, tag list and tag stats, and its reviews stay in review history', async () => {
    const [kept, archived] = await addTagged(cli, [['docker'], ['docker::commands']])
    reviewed(cli.db, archived, '2026-11-14T15:00:00.000Z')

    await archiveCard(cli, { card: archived })
    const week = await jsonOf(cli, ['review', 'history', '--days', '7'])
    const underTag = await jsonOf(cli, ['review', 'history', 'docker'])

    expect(await listedIds(cli, ['review', 'due'])).toEqual([kept])
    expect(await listedIds(cli, ['review', 'topic', 'docker'])).toEqual([kept])
    expect(await listedIds(cli, ['card', 'list'])).toEqual([kept])
    expect(await jsonOf(cli, ['tag', 'list'])).toEqual({ tags: [{ tag: 'docker', cards: 1 }] })
    expect(await jsonOf(cli, ['tag', 'stats'])).toMatchObject({ deck: { cards: 1 } })
    expect(week.reviews).toMatchObject([{ card: archived }])
    expect(underTag.reviews).toMatchObject([{ card: archived }])
  })
})
