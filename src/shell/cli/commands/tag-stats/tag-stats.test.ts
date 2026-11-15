import { beforeEach, describe, expect, it } from 'vitest'
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

  it("006-US1-AS2 tag stats gives a tag's retention over its cards' counted reviews", async () => {
    const [first, second] = await addTagged(cli, [['messaging'], ['messaging']])
    reviewed(cli.db, first, '2026-11-10T15:00:00.000Z')
    reviewed(cli.db, first, '2026-11-12T15:00:00.000Z', { grade: 'again' })
    reviewed(cli.db, second, '2026-11-14T15:00:00.000Z')

    expect(await stats()).toMatchObject({
      deck: { retention: 67 },
      tags: [{ tag: 'messaging', retention: 67 }],
    })
  })

  it('006-US1-AS3 tag stats gives the weak cards and gaps of each tag', async () => {
    const [weak, gapped] = await addTagged(cli, [
      ['messaging::rabbitmq'],
      ['messaging::redis-streams'],
    ])
    for (const day of ['01', '05', '09', '13'])
      reviewed(cli.db, weak, `2026-11-${day}T15:00:00.000Z`, { grade: 'again' })
    reviewed(cli.db, gapped, '2026-11-14T15:00:00.000Z', {
      grade: 'again',
      flag: 'missing-prerequisite',
    })

    expect(await stats()).toMatchObject({
      deck: { weak: 1, gaps: 1 },
      tags: [
        { tag: 'messaging', weak: 1, gaps: 1 },
        { tag: 'messaging::rabbitmq', weak: 1, gaps: 0 },
        { tag: 'messaging::redis-streams', weak: 0, gaps: 1 },
      ],
    })
  })

  it('tag stats prints the tree as TOON', async () => {
    const [studiedCard] = await addTagged(cli, [['messaging'], ['messaging::rabbitmq']])
    studied(cli.db, studiedCard, 'review', DUE_TODAY)
    reviewed(cli.db, studiedCard, '2026-11-10T15:00:00.000Z')

    const { code, stdout } = await cli.run(['tag', 'stats'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'deck:',
        '  cards: 2',
        '  new: 1',
        '  due: 1',
        '  retention: 100',
        '  weak: 0',
        '  gaps: 0',
        'tags[2]{tag,cards,new,due,retention,weak,gaps}:',
        '  messaging,2,1,1,100,0,0',
        '  "messaging::rabbitmq",1,1,0,null,0,0',
        '',
      ].join('\n'),
    )
  })

  it('tag stats on an empty deck gives a deck of zeros and no tags', async () => {
    expect(await stats()).toMatchObject({
      deck: { cards: 0, new: 0, due: 0, retention: null, weak: 0, gaps: 0 },
      tags: [],
    })
  })
})
