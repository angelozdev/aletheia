import { beforeEach, describe, expect, it } from 'vitest'
import type { CardDraft } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

const clock = () => new Date('2026-11-09T15:00:00.000Z')

const CODE_DRAFT: CardDraft = {
  type: 'code',
  question:
    'En TypeScript, ¿qué imprime esto?\n\n```ts\nconst saludo = "¡Hola, señor!"\nif (saludo) {\n\tconsole.log(`${saludo} \'año\'`)\n}\n```',
  answer: "Imprime `¡Hola, señor! 'año'`: la interpolación conserva la ñ y las comillas.",
  keyPoints: ['El template literal interpola `saludo`', "Las comillas 'simples' se conservan"],
  situation: 'Un log con acentos y comillas sale distinto en producción.',
  tags: ['typescript::strings'],
  source: 'diarium',
}

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore({ clock })
})

function run(argv: string[], stdin = '') {
  return cli.run(argv, stdin)
}

describe('aletheia card show', () => {
  it('001-US1-AS5 card show prints every field and when the card is due, in local time', async () => {
    await run(['card', 'add'], JSON.stringify([SAMPLE_DRAFT]))

    const { code, stdout } = await run(['card', 'show', '0123'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'id: "0123"',
        'type: command',
        'tags[1]: "docker::commands"',
        'question: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?"',
        'answer: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.',
        'keyPoints[2]: "`ps`: solo en ejecución","`-a`: incluye detenidos"',
        'situation: Un contenedor se cayó y no aparece en `docker ps`.',
        'source: diarium',
        'status: active',
        'state: new',
        'due: "2026-11-09T10:00:00-05:00"',
        'lastReview: null',
        'stability: 0',
        'difficulty: 0',
        'scheduledDays: 0',
        'learningSteps: 0',
        'reps: 0',
        'lapses: 0',
        'createdAt: "2026-11-09T10:00:00-05:00"',
        'updatedAt: "2026-11-09T10:00:00-05:00"',
        '',
      ].join('\n'),
    )
  })

  it('001-US1-AS5 card show with an unknown id exits 1 naming it', async () => {
    const { code, stdout, stderr } = await run(['card', 'show', 'zzzz'])

    expect(code).toBe(1)
    expect(stderr.endsWith('error: card "zzzz" not found\n')).toBe(true)
    expect(stdout).toBe('')
  })

  it('001-US1-AS4 a card with accents, backticks and multi-line code reads back exactly as written', async () => {
    await run(['card', 'add'], JSON.stringify([CODE_DRAFT]))

    const { code, stdout } = await run(['card', 'show', '0123', '--json'])

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toMatchObject(CODE_DRAFT)
  })
})
