import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { newCard, type CardType } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../../tests/support/cards/cards.constants.ts'
import { openTestStore, runSql, selectAll } from '../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'
import { closeStore } from '../database/database.ts'
import { StoreCardRepository } from './cards.ts'

const NOW = '2026-11-09T15:00:00.000Z'

const VALID_CARD: Record<string, string> = {
  id: 'k7m2',
  type: 'command',
  question: 'q',
  answer: 'a',
  situation: 's',
  source: 'src',
  key_points: '["one"]',
  status: 'active',
  state: 'new',
  due: NOW,
  created_at: NOW,
  updated_at: NOW,
}

let path: string

function quoted(value: string): string {
  return `'${value.replaceAll("'", "''")}'`
}

function insertCard(overrides: Record<string, string> = {}): string {
  const row = { ...VALID_CARD, ...overrides }
  return `insert into cards (${Object.keys(row).join(', ')}) values (${Object.values(row).map(quoted).join(', ')})`
}

function insertTag(tag: string, cardId = VALID_CARD.id): string {
  return `insert into card_tags (card_id, tag) values (${quoted(cardId)}, ${quoted(tag)})`
}

beforeEach(async () => {
  path = join(tempDir('aletheia-store-'), 'store.sqlite')
  closeStore(await openTestStore(path))
})

describe('StoreCardRepository', () => {
  it('saveAll stores a card and its tags', async () => {
    const store = await openTestStore(path)
    const now = new Date(NOW)

    new StoreCardRepository(store).saveAll([newCard(SAMPLE_DRAFT, 'k7m2', now)])
    closeStore(store)

    expect(selectAll(path, 'select * from cards')).toEqual([
      {
        id: 'k7m2',
        type: SAMPLE_DRAFT.type,
        question: SAMPLE_DRAFT.question,
        answer: SAMPLE_DRAFT.answer,
        situation: SAMPLE_DRAFT.situation,
        source: SAMPLE_DRAFT.source,
        key_points: JSON.stringify(SAMPLE_DRAFT.keyPoints),
        status: 'active',
        due: NOW,
        state: 'new',
        stability: 0,
        difficulty: 0,
        scheduled_days: 0,
        learning_steps: 0,
        reps: 0,
        lapses: 0,
        last_review: null,
        created_at: NOW,
        updated_at: NOW,
      },
    ])
    expect(selectAll(path, 'select card_id, tag from card_tags')).toEqual([
      { card_id: 'k7m2', tag: 'docker::commands' },
    ])
  })

  it('001-US1-AS3 saveAll stores every card or none', async () => {
    const store = await openTestStore(path)
    const now = new Date(NOW)
    const refused = { ...newCard(SAMPLE_DRAFT, 'p3x9', now), type: 'cloze' as CardType }

    try {
      expect(() =>
        new StoreCardRepository(store).saveAll([newCard(SAMPLE_DRAFT, 'k7m2', now), refused]),
      ).toThrow()
    } finally {
      closeStore(store)
    }

    expect(selectAll(path, 'select count(*) as n from cards')).toEqual([{ n: 0 }])
    expect(selectAll(path, 'select count(*) as n from card_tags')).toEqual([{ n: 0 }])
  })
})

describe('the cards table', () => {
  it('accepts a valid card and its tag', () => {
    runSql(path, insertCard())
    runSql(path, insertTag('messaging::redis-streams'))

    expect(selectAll(path, 'select count(*) as n from card_tags')).toEqual([{ n: 1 }])
  })

  it.for<[string, Record<string, string>]>([
    ['a type outside the five', { type: 'cloze' }],
    ['a status outside active and archived', { status: 'deleted' }],
    ['a state outside the four', { state: 'done' }],
    ['a blank question', { question: '  ' }],
    ['a blank answer', { answer: '  ' }],
    ['a blank situation', { situation: '  ' }],
    ['a blank source', { source: '  ' }],
    ['no key points', { key_points: '[]' }],
    ['four key points', { key_points: '["a","b","c","d"]' }],
    ['key points that are not a list', { key_points: '{}' }],
    ['an uppercase id', { id: 'K7M2' }],
    ['a short id', { id: 'k7m' }],
    ['an id with a letter outside the alphabet', { id: 'k7mi' }],
    ['a long id', { id: 'k7m2x' }],
  ])('refuses %s', ([, overrides]) => {
    expect(() => runSql(path, insertCard(overrides))).toThrow()
    expect(selectAll(path, 'select count(*) as n from cards')).toEqual([{ n: 0 }])
  })

  it.for(['mensajería', 'Docker', ''])('refuses the tag %j', (tag) => {
    runSql(path, insertCard())

    expect(() => runSql(path, insertTag(tag))).toThrow()
  })

  it('refuses the same tag twice on a card', () => {
    runSql(path, insertCard())
    runSql(path, insertTag('docker'))

    expect(() => runSql(path, insertTag('docker'))).toThrow()
  })

  it('refuses a tag for a card that does not exist', () => {
    expect(() => runSql(path, insertTag('docker', 'zzzz'))).toThrow()
  })
})
