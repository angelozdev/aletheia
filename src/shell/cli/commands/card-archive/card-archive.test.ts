import { beforeEach, describe, expect, it } from 'vitest'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { addTagged, reviewed, rowCounts } from '../../../../../tests/support/progress/progress.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'

const NOW = new Date('2026-11-15T20:00:00.000Z')
const REASON = 'no lo uso desde que dejé ese proyecto'

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore({ clock: () => NOW, randomIndex: uniqueIdDraw() })
})

async function json(argv: string[]) {
  const { stdout } = await cli.run([...argv, '--json'])
  return JSON.parse(stdout)
}

async function listedIds(argv: string[]): Promise<string[]> {
  const listed: { cards: { id: string }[] } = await json(argv)
  return listed.cards.map(({ id }) => id)
}

function archive(fields: Record<string, unknown>) {
  return cli.run(['card', 'archive', '--json'], JSON.stringify(fields))
}

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
    const before = await json(['card', 'show', id])

    const { code, stdout } = await archive({ card: id, reason: REASON })

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toEqual({
      ...before,
      status: 'archived',
      archivedAt: '2026-11-15T15:00:00-05:00',
      archiveReason: REASON,
    })
    expect(await json(['card', 'show', id])).toEqual(JSON.parse(stdout))
    expect(rowCounts(cli.db).reviews).toBe(1)
  })

  it('007-US1-AS2 card archive refuses a blank reason, an unknown field, a missing card or an archived one, and changes nothing', async () => {
    const [active, archived] = await addTagged(cli, [['docker'], ['docker']])
    await archive({ card: archived, reason: REASON })
    const before = stored(active)
    const refusals: [Record<string, unknown>, string][] = [
      [{ card: active, reason: '  ' }, 'invalid archive: reason: is required'],
      [{ card: active }, 'invalid archive: reason: is required'],
      [{ card: active, reason: REASON, due: 'x' }, 'invalid archive: due: is not an archive field'],
      [{ card: 'zzzz', reason: REASON }, 'card "zzzz" not found'],
      [{ card: archived, reason: REASON }, `card "${archived}" is archived`],
    ]

    for (const [fields, error] of refusals) {
      const { code, stdout, stderr } = await archive(fields)

      expect({ code, stdout }).toEqual({ code: 1, stdout: '' })
      expect(stderr).toMatch(new RegExp(`\\nerror: ${RegExp.escape(error)}\\n$`))
    }
    expect(stored(active)).toEqual(before)
  })

  it('007-US1-AS2 an archived card leaves review due, review topic, card list, tag list and tag stats, and its reviews stay in review history', async () => {
    const [kept, archived] = await addTagged(cli, [['docker'], ['docker::commands']])
    reviewed(cli.db, archived, '2026-11-14T15:00:00.000Z')

    await archive({ card: archived, reason: REASON })

    expect(await listedIds(['review', 'due'])).toEqual([kept])
    expect(await listedIds(['review', 'topic', 'docker'])).toEqual([kept])
    expect(await listedIds(['card', 'list'])).toEqual([kept])
    expect(await json(['tag', 'list'])).toEqual({ tags: [{ tag: 'docker', cards: 1 }] })
    expect(await json(['tag', 'stats'])).toMatchObject({ deck: { cards: 1 } })
    expect((await json(['review', 'history', '--days', '7'])).reviews).toMatchObject([
      { card: archived },
    ])
    expect((await json(['review', 'history', 'docker'])).reviews).toMatchObject([
      { card: archived },
    ])
  })
})
