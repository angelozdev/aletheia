import { beforeEach, describe, expect, it } from 'vitest'
import { uniqueIdDraw } from '../../../../../tests/support/draws/draws.ts'
import { addTagged, reviewed, rowCounts } from '../../../../../tests/support/progress/progress.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

const NOW = new Date('2026-11-15T20:00:00.000Z')
const ASKED = '¿Qué le pasa al mensaje cuando el consumidor responde?'

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore({ clock: () => NOW, randomIndex: uniqueIdDraw() })
})

async function history(argv: string[] = []) {
  const { stdout } = await cli.run(['review', 'history', ...argv, '--json'])
  return JSON.parse(stdout)
}

async function arrangeWeek(): Promise<string[]> {
  const ids = await addTagged(cli, [['messaging'], ['docker']])
  const [messaging, docker] = ids
  reviewed(cli.db, docker, '2026-11-05T15:00:00.000Z')
  reviewed(cli.db, messaging, '2026-11-12T15:00:00.000Z', { grade: 'again', claude_grade: 'hard' })
  reviewed(cli.db, docker, '2026-11-15T14:00:00.000Z', {
    flag: 'badly-rephrased',
    asked_question: ASKED,
  })
  return ids
}

describe('aletheia review history', () => {
  it('006-US3-AS1 review history gives the reviews of the last N days newest first, with card, instant, grades, flag and question as asked, and their counts', async () => {
    const [messaging, docker] = await arrangeWeek()
    const before = rowCounts(cli.db)

    const week = await history(['--days', '7'])

    expect(week).toEqual({
      counts: {
        reviews: 2,
        grades: { again: 1, hard: 0, good: 1, easy: 0 },
        flags: { 'missing-prerequisite': 0, 'badly-written': 0, 'badly-rephrased': 1 },
        disputed: 1,
      },
      reviews: [
        {
          card: docker,
          reviewedAt: '2026-11-15T09:00:00-05:00',
          grade: 'good',
          claudeGrade: 'good',
          flag: 'badly-rephrased',
          askedQuestion: ASKED,
        },
        {
          card: messaging,
          reviewedAt: '2026-11-12T10:00:00-05:00',
          grade: 'again',
          claudeGrade: 'hard',
          flag: null,
          askedQuestion: null,
        },
      ],
    })
    expect(rowCounts(cli.db)).toEqual(before)
  })

  it('review history reads the last 7 days by default and refuses a window under 1 day', async () => {
    await arrangeWeek()

    const byDefault = await history()
    const refused = await cli.run(['review', 'history', '--days', '0'])

    expect(byDefault.counts.reviews).toBe(2)
    expect(refused).toMatchObject({ code: 1, stdout: '' })
    expect(refused.stderr).toMatch(
      /error: invalid options: --days: must be a whole number, 1 or more\n$/,
    )
  })

  it('review history prints the counts and reviews as TOON', async () => {
    await arrangeWeek()

    const { code, stdout } = await cli.run(['review', 'history'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'counts:',
        '  reviews: 2',
        '  grades:',
        '    again: 1',
        '    hard: 0',
        '    good: 1',
        '    easy: 0',
        '  flags:',
        '    "missing-prerequisite": 0',
        '    "badly-written": 0',
        '    "badly-rephrased": 1',
        '  disputed: 1',
        'reviews[2]{card,reviewedAt,grade,claudeGrade,flag,askedQuestion}:',
        `  "0001","2026-11-15T09:00:00-05:00",good,good,badly-rephrased,${ASKED}`,
        '  "0000","2026-11-12T10:00:00-05:00",again,hard,null,null',
        '',
      ].join('\n'),
    )
  })
})
