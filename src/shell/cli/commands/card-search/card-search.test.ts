import { cpSync } from 'node:fs'
import { basename } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CardDraft } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { distinctIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { SHIPPED_MIGRATIONS } from '../../../../../tests/support/fixture-migrations/fixture-migrations.constants.ts'
import { cliOnTempStore, runOnStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { CliRun, StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { tempDir } from '../../../../../tests/support/temp-dir/temp-dir.ts'

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore()
})

function draftAsking(question: string): CardDraft {
  return {
    ...SAMPLE_DRAFT,
    question,
    answer: 'Una respuesta.',
    keyPoints: ['un punto'],
    situation: 'Una situación.',
  }
}

async function addCards(drafts: CardDraft[]): Promise<void> {
  await cli.run(['card', 'add'], JSON.stringify(drafts))
}

async function foundIds(query: unknown): Promise<string[]> {
  const { stdout } = await cli.run(['card', 'search', '--json'], JSON.stringify(query))
  return JSON.parse(stdout).cards.map(({ id }: { id: string }) => id)
}

function migrationsBeforeSearch(): string {
  const dir = tempDir('aletheia-migrations-')
  cpSync(SHIPPED_MIGRATIONS, dir, {
    recursive: true,
    filter: (source) => !basename(source).endsWith('_card_search'),
  })
  return dir
}

function expectRefused({ code, stdout, stderr }: CliRun, message: string): void {
  const expected = `error: invalid search: ${message}\n`
  expect(code).toBe(1)
  expect(stdout).toBe('')
  expect(stderr.slice(-expected.length)).toBe(expected)
}

describe('aletheia card search', () => {
  it('002-US1-AS2 card search finds a card that differs only in case, accents or singular and plural', async () => {
    await addCards([
      draftAsking('¿Cuántos consumidores lee un grupo?'),
      draftAsking('¿Dónde va la configuración del proyecto?'),
      SAMPLE_DRAFT,
    ])

    expect(await foundIds({ words: 'Consumidor' })).toEqual(['0123'])
    expect(await foundIds({ words: 'configuracion' })).toEqual(['4567'])
    expect(await foundIds({ words: 'contenedor' })).toEqual(['89ab'])
  })

  it('002-US1-AS3 card search lists only the 10 most similar', async () => {
    cli = cliOnTempStore({ randomIndex: distinctIdDraw() })
    await addCards(Array.from({ length: 12 }, () => SAMPLE_DRAFT))

    expect(await foundIds({ words: 'docker' })).toHaveLength(10)
  })

  it.for([
    '`docker` "ps" (NOT -a) *',
    'ps AND OR NEAR(x y)',
    'a:b ^c "unterminated',
    '```js\nconst doubled = [1, 2].map((n) => n * 2) // "x" -y\n```',
  ])(
    '002-US1-AS4 card search takes quotes, backticks, operators and code as plain text: %j',
    async (words) => {
      await addCards([SAMPLE_DRAFT])

      const { code, stdout } = await cli.run(
        ['card', 'search', '--json'],
        JSON.stringify({ words }),
      )

      expect(code).toBe(0)
      expect(() => JSON.parse(stdout)).not.toThrow()
    },
  )

  it('002-US1-AS4 card search finds a card from words full of operators', async () => {
    await addCards([SAMPLE_DRAFT])

    expect(await foundIds({ words: '`docker` "ps" (NOT -a) *' })).toEqual(['0123'])
  })

  it.for(['kubernetes', '¿qué es esto?'])(
    '002-US1-AS5 card search with nothing similar prints an empty list and succeeds: %j',
    async (words) => {
      await addCards([SAMPLE_DRAFT])

      const { code, stdout } = await cli.run(['card', 'search'], JSON.stringify({ words }))

      expect(code).toBe(0)
      expect(stdout).toBe('cards: []\n')
    },
  )

  it.for<[string, string]>([
    ['{}', 'give words, tags or both'],
    ['{ "words": "   " }', 'give words, tags or both'],
    ['{ "tags": [] }', 'give words, tags or both'],
  ])(
    '002-US1-AS5 card search refuses a search with neither words nor tags: %s',
    async ([stdin, message]) => {
      expectRefused(await cli.run(['card', 'search'], stdin), message)
    },
  )

  it.for<[string, string]>([
    ['{ "tags": ["Docker"] }', 'tags[0]: use a-z, digits and dashes, in segments joined by ::'],
    ['{ "words": "x", "limit": 5 }', 'limit: is not a search field'],
    ['{ "words": 3 }', 'words: must be text'],
    ['{ "tags": "docker" }', 'tags: must be a list'],
  ])(
    '002-US1-AS5 card search refuses a malformed tag or an unknown field: %s',
    async ([stdin, message]) => {
      expectRefused(await cli.run(['card', 'search'], stdin), message)
    },
  )

  it('002-US1-AS6 card search finds cards saved before the search migration', async () => {
    const migrationsDir = migrationsBeforeSearch()
    await runOnStore(cli.db, ['card', 'add'], JSON.stringify([SAMPLE_DRAFT]), { migrationsDir })

    const { stdout, stderr } = await runOnStore(
      cli.db,
      ['card', 'search', '--json'],
      '{ "words": "docker" }',
    )

    expect(stderr).toMatch(/\nmigrated: \d+_card_search\n/)
    expect(JSON.parse(stdout).cards.map(({ id }: { id: string }) => id)).toEqual(['0123'])
  })

  it('002-US1-AS6 card search finds a card as soon as it is saved', async () => {
    await addCards([SAMPLE_DRAFT])

    expect(await foundIds({ words: 'docker' })).toEqual(['0123'])
  })

  it('card search prints a card as the contract shows it', async () => {
    await addCards([SAMPLE_DRAFT])

    const { code, stdout } = await cli.run(['card', 'search'], '{ "words": "docker" }')

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'cards[1]:',
        '  - id: "0123"',
        '    type: command',
        '    tags[1]: "docker::commands"',
        '    question: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?"',
        '    answer: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.',
        '',
      ].join('\n'),
    )
  })
})
