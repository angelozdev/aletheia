import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { cliOnTempStore, runOnStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { runSql, selectAll } from '../../../../../tests/support/store/store.ts'

const NOW = '2026-11-09T15:00:00.000Z'
const TEN_MINUTES_LATER = '2026-11-09T15:10:00.000Z'

const GRADE = {
  card: '0123',
  grade: 'good',
  claudeGrade: 'good',
  answer: 'ps muestra los que corren, -a todos',
  rationale: 'Cubre los dos key points, sin dudar.',
}

let cli: StoreCli

beforeEach(async () => {
  cli = cliOnTempStore({ clock: () => new Date(NOW) })
  await cli.run(['card', 'add'], JSON.stringify([SAMPLE_DRAFT]))
})

function grade(fields: Record<string, string>, at = NOW) {
  return runOnStore(cli.db, ['review', 'grade'], JSON.stringify({ ...GRADE, ...fields }), {
    clock: () => new Date(at),
  })
}

function reviewDue(at: string) {
  return runOnStore(cli.db, ['review', 'due', '--json'], '', { clock: () => new Date(at) })
}

function recordedReviews() {
  return selectAll(
    cli.db,
    'select card_id, grade, claude_grade, state_before, reviewed_at, answer, rationale from reviews',
  )
}

describe('aletheia review grade', () => {
  it('001-US2-AS2 review grade logs the review with its instant and the state before, and prints the next due instant', async () => {
    const { code, stdout } = await grade({})

    expect(code).toBe(0)
    expect(stdout).toBe(
      'card: "0123"\ngrade: good\nstate: review\ndue: "2026-11-11T10:00:00-05:00"\n',
    )
    expect(recordedReviews()).toEqual([
      {
        card_id: '0123',
        grade: 'good',
        claude_grade: 'good',
        state_before: 'new',
        reviewed_at: NOW,
        answer: GRADE.answer,
        rationale: GRADE.rationale,
      },
    ])
    expect(selectAll(cli.db, 'select state, due, reps from cards')).toEqual([
      { state: 'review', due: '2026-11-11T15:00:00.000Z', reps: 1 },
    ])
  })

  it('a dispute keeps both grades', async () => {
    await grade({ grade: 'easy', claudeGrade: 'good' })

    expect(recordedReviews()).toMatchObject([{ grade: 'easy', claude_grade: 'good' }])
  })

  it('an early review is recorded', async () => {
    await grade({})
    runSql(cli.db, "update cards set due = '2026-11-14T15:00:00.000Z'")

    const { code } = await grade({})

    expect(code).toBe(0)
    expect(recordedReviews()).toHaveLength(2)
    expect(selectAll(cli.db, 'select due from cards')).not.toEqual([
      { due: '2026-11-14T15:00:00.000Z' },
    ])
  })

  it('001-US2-AS4 a card graded Again is due again while nothing else is', async () => {
    await grade({ grade: 'again', claudeGrade: 'again' })
    const stepping = await reviewDue(NOW)
    await grade({}, TEN_MINUTES_LATER)
    const learned = await reviewDue(TEN_MINUTES_LATER)

    expect(JSON.parse(stepping.stdout)).toMatchObject({ count: 1, cards: [{ id: '0123' }] })
    expect(JSON.parse(learned.stdout)).toEqual({
      count: 0,
      nextDue: '2026-11-10T10:10:00-05:00',
      cards: [],
    })
  })
})
