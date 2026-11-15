import { beforeEach, describe, expect, it } from 'vitest'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import {
  addTagged,
  reviewed,
  rowCounts,
  studied,
} from '../../../../../tests/support/progress/progress.ts'
import { failed } from '../../../../../tests/support/prune/prune.ts'
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

  it('006-US1-AS4 tag stats under a tag gives only it and its descendants, and a deck over their cards', async () => {
    await addTagged(cli, [['messaging::rabbitmq'], ['messaging', 'docker'], ['docker::logs']])

    const tree = await stats(['messaging'])
    const rows = tree.tags.map(({ tag }: { tag: string }) => tag)

    expect(tree.deck).toMatchObject({ cards: 2 })
    expect(rows).toEqual(['messaging', 'messaging::rabbitmq'])
  })

  it('006-US1-AS4 tag stats refuses a tag with no active card under it', async () => {
    await addTagged(cli, [['messaging']])

    const uncovered = await cli.run(['tag', 'stats', 'kafka'])
    const malformed = await cli.run(['tag', 'stats', 'messaging::Redis'])

    expect(uncovered).toMatchObject({ code: 1, stdout: '' })
    expect(uncovered.stderr).toMatch(/error: no active card under kafka\n$/)
    expect(malformed).toMatchObject({ code: 1, stdout: '' })
    expect(malformed.stderr).toMatch(/error: invalid topic: messaging::Redis: /)
  })

  it('006-US1-AS5 tag stats sorts siblings by a field in either direction', async () => {
    const [rabbit, redis] = await addTagged(cli, [
      ['messaging::rabbitmq'],
      ['messaging::redis-streams'],
    ])
    reviewed(cli.db, rabbit, '2026-11-10T15:00:00.000Z')
    reviewed(cli.db, redis, '2026-11-10T15:00:00.000Z', { grade: 'again' })
    const rowsOf = ({ tags }: { tags: { tag: string }[] }) => tags.map(({ tag }) => tag)

    const ascending = await stats(['--sort', 'retention'])
    const descending = await stats(['--sort', 'retention', '--desc'])

    expect(rowsOf(ascending)).toEqual([
      'messaging',
      'messaging::redis-streams',
      'messaging::rabbitmq',
    ])
    expect(rowsOf(descending)).toEqual([
      'messaging',
      'messaging::rabbitmq',
      'messaging::redis-streams',
    ])
  })

  it('006-US1-AS5 tag stats refuses an unknown sort field naming the valid ones', async () => {
    const { code, stdout, stderr } = await cli.run(['tag', 'stats', '--sort', 'nope'])

    expect(code).toBe(1)
    expect(stdout).toBe('')
    expect(stderr).toMatch(
      /error: invalid options: --sort: must be tag, cards, new, due, retention, weak or gaps\n$/,
    )
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
        '  candidates: 0',
        'tags[2]{tag,cards,new,due,retention,weak,gaps}:',
        '  messaging,2,1,1,100,0,0',
        '  "messaging::rabbitmq",1,1,0,null,0,0',
        '',
      ].join('\n'),
    )
  })

  it('tag stats on an empty deck gives a deck of zeros and no tags', async () => {
    expect(await stats()).toEqual({
      deck: { cards: 0, new: 0, due: 0, retention: null, weak: 0, gaps: 0, candidates: 0 },
      tags: [],
    })
  })

  it('007-US1-AS5 tag stats gives in its deck line how many cards are candidates', async () => {
    const [leech, passing] = await addTagged(cli, [['messaging'], ['docker']])
    failed(cli, leech)
    failed(cli, passing, 2)

    expect((await stats()).deck).toMatchObject({ candidates: 1 })
    expect((await stats(['messaging'])).deck).toMatchObject({ candidates: 1 })
    expect((await stats(['docker'])).deck).toMatchObject({ candidates: 0 })
  })

  it('007-US4-AS2 a kept leech leaves the deck count of candidates', async () => {
    const [leech] = await addTagged(cli, [['messaging']])
    failed(cli, leech)

    await cli.run(['card', 'keep', leech, '--reason', 'leech'])

    expect((await stats()).deck).toMatchObject({ weak: 1, candidates: 0 })
  })
})
