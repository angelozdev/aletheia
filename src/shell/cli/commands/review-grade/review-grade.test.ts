import { beforeEach, describe, expect, it } from 'vitest'
import { ASKED, SAMPLE_DRAFT } from '../../../../../tests/support/cards/cards.constants.ts'
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
  askedQuestion: ASKED,
}

let cli: StoreCli

beforeEach(async () => {
  cli = cliOnTempStore({ clock: () => new Date(NOW) })
  await cli.run(['card', 'add'], JSON.stringify([SAMPLE_DRAFT]))
})

function gradeText(stdin: string, at = NOW) {
  return runOnStore(cli.db, ['review', 'grade'], stdin, { clock: () => new Date(at) })
}

function grade(fields: Record<string, unknown>, at = NOW) {
  return gradeText(JSON.stringify({ ...GRADE, ...fields }), at)
}

function gradeWithout(field: string): string {
  const fields = Object.entries(GRADE).filter(([key]) => key !== field)
  return JSON.stringify(Object.fromEntries(fields))
}

function reviewDue(at: string) {
  return runOnStore(cli.db, ['review', 'due', '--json'], '', { clock: () => new Date(at) })
}

async function shownCard() {
  const { stdout } = await runOnStore(cli.db, ['card', 'show', '0123', '--json'])
  return JSON.parse(stdout)
}

async function expectVoided(flag: string, finalGrade: string): Promise<void> {
  const before = await shownCard()

  const { code, stdout } = await grade({ grade: finalGrade, claudeGrade: 'hard', flag })

  expect(code).toBe(0)
  expect(stdout).toBe(
    `card: "0123"\ngrade: ${finalGrade}\nstate: ${before.state}\ndue: "${before.due}"\n`,
  )
  expect(
    selectAll(
      cli.db,
      'select grade, claude_grade, answer, rationale, flag, asked_question from reviews',
    ),
  ).toEqual([
    {
      grade: finalGrade,
      claude_grade: 'hard',
      answer: GRADE.answer,
      rationale: GRADE.rationale,
      flag,
      asked_question: ASKED,
    },
  ])
  expect(await shownCard()).toEqual(before)
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
      session: '2026-11-09T10:10:00-05:00',
      count: 0,
      remaining: 0,
      heldBack: 0,
      capReached: false,
      nextDue: '2026-11-10T10:10:00-05:00',
      cards: [],
    })
  })

  it("005-US1-AS1 review grade logs the question as asked and leaves the card's stored question unchanged", async () => {
    const { code } = await grade({ askedQuestion: ASKED })

    expect(code).toBe(0)
    expect(selectAll(cli.db, 'select asked_question from reviews')).toEqual([
      { asked_question: ASKED },
    ])
    expect((await shownCard()).question).toBe(SAMPLE_DRAFT.question)
  })

  it('004-US1-AS1 review grade logs a missing-prerequisite Again and reschedules the card like any Again', async () => {
    const { code } = await grade({
      grade: 'again',
      claudeGrade: 'again',
      flag: 'missing-prerequisite',
    })

    expect(code).toBe(0)
    expect(selectAll(cli.db, 'select flag from reviews')).toEqual([
      { flag: 'missing-prerequisite' },
    ])
    expect(selectAll(cli.db, 'select state, due from cards')).toEqual([
      { state: 'learning', due: TEN_MINUTES_LATER },
    ])
  })

  it.for(['again', 'good'])(
    "004-US2-AS1 review grade logs a badly-written review with both grades and leaves the card's schedule unchanged",
    (finalGrade) => expectVoided('badly-written', finalGrade),
  )

  it.for(['again', 'good'])(
    "005-US2-AS1 review grade logs a badly-rephrased review with both grades, the answer, the rationale and the question as asked, and leaves the card's schedule unchanged",
    (finalGrade) => expectVoided('badly-rephrased', finalGrade),
  )

  it('review grade records the card a prerequisite was asked for', async () => {
    await cli.run(['card', 'add'], JSON.stringify([SAMPLE_DRAFT]))

    const { code } = await grade({
      card: '4567',
      grade: 'again',
      claudeGrade: 'again',
      prerequisiteOf: '0123',
    })

    expect(code).toBe(0)
    expect(selectAll(cli.db, 'select card_id, prerequisite_of from reviews')).toEqual([
      { card_id: '4567', prerequisite_of: '0123' },
    ])
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

    it.for<[string, string]>([
      ['no question as asked', gradeWithout('askedQuestion')],
      ['a blank question as asked', JSON.stringify({ ...GRADE, askedQuestion: '  ' })],
    ])('005-US1-AS2 review grade refuses %s', async ([, stdin]) => {
      expectRefused(await gradeText(stdin), line('invalid review: askedQuestion: is required'))
    })

    it('001-US2-AS6 review grade names a missing answer and rationale together', async () => {
      const run = await grade({ answer: '', rationale: '' })

      expectRefused(run, line('invalid review: answer: is required; rationale: is required'))
    })

    it.for<[Record<string, unknown>, string]>([
      [
        { grade: 'hard', flag: 'missing-prerequisite' },
        'flag: missing-prerequisite needs the grade again',
      ],
      [{ flag: 'trivia' }, 'flag: must be missing-prerequisite, badly-written or badly-rephrased'],
      [
        { flag: ['missing-prerequisite', 'badly-written'] },
        'flag: must be missing-prerequisite, badly-written or badly-rephrased',
      ],
    ])(
      '004-US1-AS2 review grade refuses a missing-prerequisite that is not Again, and a flag outside the three',
      async ([fields, message]) => {
        expectRefused(await grade(fields), line(`invalid review: ${message}`))
      },
    )

    it.for([
      [{ prerequisiteOf: '0123' }, 'invalid review: prerequisiteOf: must be another card'],
      [{ prerequisiteOf: 'zzzz' }, 'card "zzzz" not found'],
    ] as const)(
      '004-US1-AS2 review grade refuses a card as its own prerequisite, or as the prerequisite of a card that does not exist',
      async ([fields, error]) => {
        expectRefused(await grade(fields), line(error))
      },
    )

    it('review grade refuses a field that is not a review field', async () => {
      const run = await grade({ note: 'una nota' })

      expectRefused(run, line('invalid review: note: is not a review field'))
    })

    it('review grade refuses malformed JSON', async () => {
      expectRefused(await gradeText('not json'), /\nerror: invalid JSON on stdin: [^\n]+\n$/)
    })
  })
})
