import { beforeEach, describe, expect, it } from 'vitest'
import { SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
import { cliOnTempStore, runOnStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { CliRun, StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
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

function gradeText(stdin: string, at = NOW) {
  return runOnStore(cli.db, ['review', 'grade'], stdin, { clock: () => new Date(at) })
}

function grade(fields: Record<string, string>, at = NOW) {
  return gradeText(JSON.stringify({ ...GRADE, ...fields }), at)
}

function gradeWithout(field: string): string {
  const fields = Object.entries(GRADE).filter(([key]) => key !== field)
  return JSON.stringify(Object.fromEntries(fields))
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

  describe('refusals', () => {
    let cardBefore: unknown

    beforeEach(() => {
      cardBefore = selectAll(cli.db, 'select * from cards')
    })

    function expectRefused({ code, stdout, stderr }: CliRun, error: RegExp): void {
      expect(code).toBe(1)
      expect(stdout).toBe('')
      expect(stderr).toMatch(error)
      expect(recordedReviews()).toEqual([])
      expect(selectAll(cli.db, 'select * from cards')).toEqual(cardBefore)
    }

    function line(error: string): RegExp {
      return new RegExp(`\\nerror: ${RegExp.escape(error)}\\n$`)
    }

    it('001-US2-AS6 review grade refuses an unknown card', async () => {
      expectRefused(await grade({ card: 'zzzz' }), line('card "zzzz" not found'))
    })

    it.for([
      ['grade', 'grade: must be again, hard, good or easy'],
      ['claudeGrade', 'claudeGrade: must be again, hard, good or easy'],
    ])('001-US2-AS6 review grade refuses a %s outside the four', async ([field, message]) => {
      expectRefused(await grade({ [field]: 'perfect' }), line(`invalid review: ${message}`))
    })

    it.for<[string, string]>([
      ['no answer', gradeWithout('answer')],
      ['a blank answer', JSON.stringify({ ...GRADE, answer: '  ' })],
    ])('001-US2-AS6 review grade refuses %s', async ([, stdin]) => {
      expectRefused(await gradeText(stdin), line('invalid review: answer: is required'))
    })

    it.for<[string, string]>([
      ['no rationale', gradeWithout('rationale')],
      ['a blank rationale', JSON.stringify({ ...GRADE, rationale: ' ' })],
    ])('001-US2-AS6 review grade refuses %s', async ([, stdin]) => {
      expectRefused(await gradeText(stdin), line('invalid review: rationale: is required'))
    })

    it('001-US2-AS6 review grade names a missing answer and rationale together', async () => {
      const run = await grade({ answer: '', rationale: '' })

      expectRefused(run, line('invalid review: answer: is required; rationale: is required'))
    })

    it('review grade refuses a field that is not a review field', async () => {
      const run = await grade({ note: 'una nota' })

      expectRefused(run, line('invalid review: note: is not a review field'))
    })

    it('review grade refuses malformed JSON', async () => {
      expectRefused(await gradeText('not json'), /\nerror: invalid JSON on stdin: [^\n]+\n$/)
    })
  })
})
