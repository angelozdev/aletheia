import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore({ clock: () => new Date('2026-11-12T02:00:00.000Z') })
})

function run(argv: string[], stdin = '') {
  return cli.run(argv, stdin)
}

async function addTagged(tagLists: string[][]): Promise<void> {
  const drafts = tagLists.map((tags) => ({ ...SAMPLE_DRAFT, tags }))
  await run(['card', 'add'], JSON.stringify(drafts))
}

describe('aletheia tag list', () => {
  it('003-US1-AS1 tag list gives every tag and its ancestors with the active cards each covers', async () => {
    await addTagged([
      ['messaging::redis-streams'],
      ['messaging::rabbitmq'],
      ['docker::commands'],
      ['messaging::rabbitmq', 'messaging::redis-streams'],
    ])

    const { code, stdout } = await run(['tag', 'list'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'tags[5]{tag,cards}:',
        '  docker,1',
        '  "docker::commands",1',
        '  messaging,3',
        '  "messaging::rabbitmq",2',
        '  "messaging::redis-streams",2',
        '',
      ].join('\n'),
    )
  })

  it('tag list on an empty deck prints no tags', async () => {
    const { code, stdout } = await run(['tag', 'list'])

    expect(code).toBe(0)
    expect(stdout).toBe('tags: []\n')
  })
})
