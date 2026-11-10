import { beforeEach, describe, expect, it } from 'vitest'
import type { CardDraft } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { distinctIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

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
