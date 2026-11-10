import { beforeEach, describe, expect, it } from 'vitest'
import { taggedDrafts } from '../../../../../tests/support/cards/cards.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

let now: Date
let cli: StoreCli

beforeEach(() => {
  now = new Date('2026-11-12T02:00:00.000Z')
  cli = cliOnTempStore({ clock: () => now })
})

function run(argv: string[], stdin = '') {
  return cli.run(argv, stdin)
}

async function addTagged(tagLists: string[][]): Promise<void> {
  await run(['card', 'add'], taggedDrafts(tagLists))
}

async function topicIds(tags: string[]): Promise<string[]> {
  const { stdout } = await run(['review', 'topic', ...tags, '--json'])
  return JSON.parse(stdout).cards.map(({ id }: { id: string }) => id)
}

describe('aletheia review topic', () => {
  it('003-US1-AS2 review topic holds a tag and its descendants, never a sibling prefix or an ancestor', async () => {
    await addTagged([['messaging'], ['messaging::rabbitmq'], ['messaging-legacy'], ['docker']])

    expect(await topicIds(['messaging'])).toEqual(['0123', '4567'])
    expect(await topicIds(['messaging::rabbitmq'])).toEqual(['4567'])
  })

  it('003-US1-AS6 review topic over two branches lists the cards under either, each once', async () => {
    await addTagged([
      ['messaging::redis-streams'],
      ['databases::redis'],
      ['messaging::redis-streams', 'databases::redis'],
      ['docker'],
    ])

    const { code, stdout } = await run([
      'review',
      'topic',
      'messaging::redis-streams',
      'databases::redis',
      '--json',
    ])

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toMatchObject({
      count: 3,
      cards: [{ id: '0123' }, { id: '4567' }, { id: '89ab' }],
    })
  })
})
