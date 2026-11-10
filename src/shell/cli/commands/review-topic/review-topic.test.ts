import { beforeEach, describe, expect, it } from 'vitest'
import { taggedDrafts } from '../../../../../tests/support/cards/cards.ts'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'
import { runSql, selectAll } from '../../../../../tests/support/store/store.ts'

let now: Date
let cli: StoreCli

beforeEach(() => {
  now = new Date('2026-11-12T02:00:00.000Z')
  cli = cliOnTempStore({ clock: () => now })
})

function run(argv: string[], stdin = '') {
  return cli.run(argv, stdin)
}

async function addTagged(tagLists: string[][]): Promise<void> {
  await run(['card', 'add'], taggedDrafts(tagLists))
}

function arrange(id: string, state: string, due: string): void {
  runSql(cli.db, `update cards set state = '${state}', due = '${due}' where id = '${id}'`)
}

function messagingCards(count: number): Promise<void> {
  return addTagged(Array.from({ length: count }, () => ['messaging']))
}

function grade(card: string, grade: string) {
  const review = { card, grade, claudeGrade: grade, answer: 'x', rationale: 'y' }
  return run(['review', 'grade'], JSON.stringify(review))
}

async function topicIds(tags: string[]): Promise<string[]> {
  const { stdout } = await run(['review', 'topic', ...tags, '--json'])
  return JSON.parse(stdout).cards.map(({ id }: { id: string }) => id)
}

describe('aletheia review topic', () => {
  it('003-US1-AS2 review topic holds a tag and its descendants, never a sibling prefix or an ancestor', async () => {
    await addTagged([['messaging'], ['messaging::rabbitmq'], ['messaging-legacy'], ['docker']])

    expect(await topicIds(['messaging'])).toEqual(['0123', '4567'])
    expect(await topicIds(['messaging::rabbitmq'])).toEqual(['4567'])
  })

  it('003-US1-AS6 review topic over two branches lists the cards under either, each once', async () => {
    await addTagged([
      ['messaging::redis-streams'],
      ['databases::redis'],
      ['messaging::redis-streams', 'databases::redis'],
      ['docker'],
    ])

    const { code, stdout } = await run([
      'review',
      'topic',
      'messaging::redis-streams',
      'databases::redis',
      '--json',
    ])

    expect(code).toBe(0)
    expect(JSON.parse(stdout)).toMatchObject({
      count: 3,
      cards: [{ id: '0123' }, { id: '4567' }, { id: '89ab' }],
    })
  })

  it('003-US1-AS3 review topic lists due relearning, due review, new, then due in 3 and in 30 days, with their fields and count', async () => {
    await messagingCards(5)
    arrange('0123', 'review', '2026-11-14T15:00:00.000Z')
    arrange('89ab', 'review', '2026-12-11T15:00:00.000Z')
    arrange('cdef', 'relearning', '2026-11-12T01:50:00.000Z')
    arrange('ghjk', 'review', '2026-11-11T20:00:00.000Z')

    const { code, stdout } = await run(['review', 'topic', 'messaging', '--json'])
    const topic = JSON.parse(stdout)

    expect(code).toBe(0)
    expect(topic.count).toBe(5)
    expect(topic.cards.map(({ id }: { id: string }) => id)).toEqual([
      'cdef',
      'ghjk',
      '4567',
      '0123',
      '89ab',
    ])
    for (const card of topic.cards)
      expect(Object.keys(card)).toEqual(['id', 'type', 'tags', 'question', 'keyPoints', 'answer'])
  })

  it('003-US1-AS4 a topic card not due for 30 days is graded like any other', async () => {
    await messagingCards(1)
    arrange('0123', 'review', '2026-12-12T02:00:00.000Z')

    const listed = await topicIds(['messaging'])
    const { code } = await grade('0123', 'good')
    const { stdout } = await run(['card', 'show', '0123', '--json'])
    const card = JSON.parse(stdout)

    expect(listed).toEqual(['0123'])
    expect(code).toBe(0)
    expect(selectAll(cli.db, 'select * from reviews')).toMatchObject([
      { state_before: 'review', reviewed_at: '2026-11-12T02:00:00.000Z' },
    ])
    expect(card.lastReview).toBe('2026-11-11T21:00:00-05:00')
    expect(card.due).not.toBe('2026-12-11T21:00:00-05:00')
  })

  it('003-US1-AS5 review topic leaves out a card graded today; a card graded Again comes back when its step ends', async () => {
    await messagingCards(4)
    await grade('0123', 'good')
    await grade('4567', 'again')
    arrange('89ab', 'review', '2026-11-20T15:00:00.000Z')
    arrange('cdef', 'review', '2026-11-11T20:00:00.000Z')

    const atNow = await topicIds(['messaging'])
    now = new Date('2026-11-12T02:11:00.000Z')
    const later = await topicIds(['messaging'])

    expect(atNow).toEqual(['cdef', '89ab'])
    expect(later).toEqual(['4567', 'cdef', '89ab'])
  })

  it('003-US1-AS7 review topic refuses a malformed tag or one with no active card, naming it; all graded today lists nothing and names the next due', async () => {
    await messagingCards(2)

    const malformed = await run(['review', 'topic', 'messaging::Redis', 'docker::'])
    const uncovered = await run(['review', 'topic', 'kafka', 'messaging', 'nats'])
    runSql(cli.db, "update cards set state = 'review', last_review = '2026-11-11T15:00:00.000Z'")
    arrange('0123', 'review', '2026-11-14T15:00:00.000Z')
    arrange('4567', 'review', '2026-11-20T15:00:00.000Z')
    const allGraded = await run(['review', 'topic', 'messaging', '--json'])

    expect(malformed).toMatchObject({ code: 1, stdout: '' })
    expect(malformed.stderr).toMatch(
      /error: invalid topic: messaging::Redis: use a-z, digits and dashes, in segments joined by ::; docker::: use a-z, digits and dashes, in segments joined by ::\n$/,
    )
    expect(uncovered).toMatchObject({ code: 1, stdout: '' })
    expect(uncovered.stderr).toMatch(/error: no active card under kafka, nats\n$/)
    expect(JSON.parse(allGraded.stdout)).toMatchObject({
      count: 0,
      nextDue: '2026-11-14T10:00:00-05:00',
      cards: [],
    })
  })
})
