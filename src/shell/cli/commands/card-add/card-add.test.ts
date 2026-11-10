import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { FIXED_INSTANT } from '../../../../../tests/support/run-cli/run-cli.constants.ts'
import { runOnStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import { selectAll } from '../../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../../tests/support/temp-dir/temp-dir.ts'

let db: string

beforeEach(() => {
  db = join(tempDir('aletheia-cli-'), 'store.sqlite')
})

function cardAdd(cards: unknown, argv: string[] = []) {
  return runOnStore(db, ['card', 'add', ...argv], JSON.stringify(cards))
}

describe('aletheia card add', () => {
  it('001-US1-AS1 card add stores a valid card active and new, due now, and prints its id', async () => {
    const { code, stdout, stderr } = await cardAdd([SAMPLE_DRAFT])

    expect(code).toBe(0)
    expect(stdout).toBe('ids[1]: "0123"\n')
    expect(stderr.startsWith(`env: custom (${db})\n`)).toBe(true)
    expect(
      selectAll(db, 'select id, status, state, due, created_at, updated_at from cards'),
    ).toEqual([
      {
        id: '0123',
        status: 'active',
        state: 'new',
        due: FIXED_INSTANT,
        created_at: FIXED_INSTANT,
        updated_at: FIXED_INSTANT,
      },
    ])
    expect(selectAll(db, 'select tag from card_tags')).toEqual([{ tag: 'docker::commands' }])
  })

  it('001-US1-AS1 --json prints the ids as JSON', async () => {
    const { code, stdout } = await cardAdd([SAMPLE_DRAFT], ['--json'])

    expect(code).toBe(0)
    expect(stdout).toBe('{"ids":["0123"]}\n')
  })
})
