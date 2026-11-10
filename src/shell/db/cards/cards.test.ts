import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { CardIdTakenError, newCard, type CardType } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../../tests/support/cards/cards.constants.ts'
import {
  insertSql,
  openTestStore,
  runSql,
  selectAll,
} from '../../../../tests/support/store/store.ts'
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

function insertCard(overrides: Record<string, string> = {}): string {
  return insertSql('cards', { ...VALID_CARD, ...overrides })
}

function insertTag(tag: string, cardId = VALID_CARD.id): string {
  return insertSql('card_tags', { card_id: cardId, tag })
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

  it('saveAll refuses an id that is taken and stores none', async () => {
    const store = await openTestStore(path)
    const now = new Date(NOW)
    const repository = new StoreCardRepository(store)
    repository.saveAll([newCard(SAMPLE_DRAFT, 'k7m2', now)])

    try {
      expect(() =>
        repository.saveAll([
          newCard(SAMPLE_DRAFT, 'p3x9', now),
          newCard(SAMPLE_DRAFT, 'k7m2', now),
        ]),
      ).toThrow(CardIdTakenError)
    } finally {
      closeStore(store)
    }

    expect(selectAll(path, 'select id from cards')).toEqual([{ id: 'k7m2' }])
  })

  it('INV-02 the store refuses to delete a card', async () => {
    const store = await openTestStore(path)
    new StoreCardRepository(store).saveAll([newCard(SAMPLE_DRAFT, 'k7m2', new Date(NOW))])
    closeStore(store)

    expect(() => runSql(path, 'delete from cards')).toThrow('cards are never deleted')
    runSql(path, "update cards set due = '2026-11-10T15:00:00.000Z'")

    expect(selectAll(path, 'select id, due from cards')).toEqual([
      { id: 'k7m2', due: '2026-11-10T15:00:00.000Z' },
    ])
  })

  it('matching returns the active cards holding a term as a prefix, most relevant first', async () => {
    const store = await openTestStore(path)
    const now = new Date(NOW)
    const plain = { ...SAMPLE_DRAFT, answer: 'a', keyPoints: ['k'], situation: 's' }
    const repository = new StoreCardRepository(store)
    repository.saveAll([
      newCard({ ...plain, question: 'docker' }, 'p3x9', now),
      newCard({ ...plain, question: 'git rebase' }, 'w4n8', now),
      newCard({ ...plain, question: 'docker docker ps' }, 'k7m2', now),
    ])

    try {
      const ids = repository.matching(['docker', 'ps']).map(({ id }) => id)

      expect(ids).toEqual(['k7m2', 'p3x9'])
      expect(repository.matching([])).toEqual([])
    } finally {
      closeStore(store)
    }
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
