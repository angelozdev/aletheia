import { beforeEach, describe, expect, it } from 'vitest'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { addTagged, rowCounts, studied } from '../../../../../tests/support/progress/progress.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

const NOW = new Date('2026-11-15T20:00:00.000Z')
const DUE_TODAY = '2026-11-15T23:00:00.000Z'

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore({ clock: () => NOW, randomIndex: uniqueIdDraw() })
})

async function stats(argv: string[] = []) {
  const { stdout } = await cli.run(['tag', 'stats', ...argv, '--json'])
  return JSON.parse(stdout)
}

describe('aletheia tag stats', () => {
  it('006-US1-AS1 tag stats gives every tag in use and its ancestors, and the deck, with their cards, new cards and cards due today, each card once', async () => {
    const [both, rabbit] = await addTagged(cli, [
      ['messaging::rabbitmq', 'messaging::redis-streams'],
      ['messaging::rabbitmq'],
      ['docker'],
    ])
    studied(cli.db, both, 'review', DUE_TODAY)
    studied(cli.db, rabbit, 'review', DUE_TODAY)
    const before = rowCounts(cli.db)

    const tree = await stats()

    expect(tree).toMatchObject({
      deck: { cards: 3, new: 1, due: 2 },
      tags: [
        { tag: 'docker', cards: 1, new: 1, due: 0 },
        { tag: 'messaging', cards: 2, new: 0, due: 2 },
        { tag: 'messaging::rabbitmq', cards: 2, new: 0, due: 2 },
        { tag: 'messaging::redis-streams', cards: 1, new: 0, due: 1 },
      ],
    })
    expect(tree.tags).toHaveLength(4)
    expect(rowCounts(cli.db)).toEqual(before)
  })

  it('tag stats on an empty deck gives a deck of zeros and no tags', async () => {
    expect(await stats()).toMatchObject({ deck: { cards: 0, new: 0, due: 0 }, tags: [] })
  })
})
