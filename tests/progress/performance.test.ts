import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { uniqueIdDraw } from '../support/draws/draws.ts'
import { addTagged, rowCounts } from '../support/progress/progress.ts'
import { cliOnTempStore } from '../support/run-cli/run-cli.ts'
import { insertSql, runSql } from '../support/store/store.ts'

const CARDS = 1000
const TAGS = 20
const REVIEWS = 20_000
const LIMIT_MS = 1000
const GRADES = ['again', 'hard', 'good', 'easy']

const cli = cliOnTempStore(
  { clock: () => new Date('2026-11-15T20:00:00.000Z'), randomIndex: uniqueIdDraw() },
  afterAll,
)

function reviewRow(ids: string[], index: number): string {
  const day = new Date(Date.UTC(2026, 9, 1 + (index % 45), 15))
  return insertSql('reviews', {
    card_id: ids[index % ids.length],
    grade: GRADES[index % GRADES.length],
    claude_grade: 'good',
    state_before: 'review',
    reviewed_at: day.toISOString(),
    answer: 'a',
    rationale: 'r',
  })
}

beforeAll(async () => {
  const tagLists = Array.from({ length: CARDS }, (_, index) => [`topic-${index % TAGS}::cards`])
  const ids = await addTagged(cli, tagLists)
  const rows = Array.from({ length: REVIEWS }, (_, index) => reviewRow(ids, index))
  runSql(cli.db, `begin; ${rows.join(';\n')}; commit;`)
  expect(rowCounts(cli.db)).toEqual({ cards: CARDS, cardTags: CARDS, reviews: REVIEWS })
}, 60_000)

async function elapsedMs(argv: string[]): Promise<number> {
  const start = performance.now()
  const { code } = await cli.run(argv)
  expect(code).toBe(0)
  return performance.now() - start
}

describe('progress on 1,000 cards and 20,000 reviews', () => {
  it('SC-003 tag stats answers in under 1 second on 1,000 cards and 20,000 reviews', async () => {
    expect(await elapsedMs(['tag', 'stats'])).toBeLessThan(LIMIT_MS)
  })

  it('SC-003 card list answers in under 1 second on 1,000 cards and 20,000 reviews', async () => {
    expect(await elapsedMs(['card', 'list', '--sort', 'failures', '--desc'])).toBeLessThan(LIMIT_MS)
  })

  it('SC-003 review history answers in under 1 second on 1,000 cards and 20,000 reviews', async () => {
    expect(await elapsedMs(['review', 'history', '--days', '30'])).toBeLessThan(LIMIT_MS)
  })
})
