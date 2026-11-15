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
const LATER = '2026-11-10T15:00:00.000Z'
const STATUS_CHANGES = 'select card_id, status, reason, changed_at from card_status_history'
const ARCHIVED_ROW = {
  card_id: 'k7m2',
  status: 'archived',
  reason: 'ya no lo uso',
  changed_at: LATER,
}

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

async function withSavedCard(action: (repository: StoreCardRepository) => void): Promise<void> {
  const store = await openTestStore(path)
  try {
    const repository = new StoreCardRepository(store)
    repository.saveAll([newCard(SAMPLE_DRAFT, 'k7m2', new Date(NOW))])
    action(repository)
  } finally {
    closeStore(store)
  }
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

  it('update replaces the content and the tags and leaves the schedule', async () => {
    const card = newCard(SAMPLE_DRAFT, 'k7m2', new Date(NOW))
    const later = new Date('2026-11-10T15:00:00.000Z')
    const kept = 'select state, due, reps, last_review, source, created_at from cards'
    const saving = await openTestStore(path)
    new StoreCardRepository(saving).saveAll([card])
    closeStore(saving)
    const before = selectAll(path, kept)

    const store = await openTestStore(path)
    const repository = new StoreCardRepository(store)
    repository.update({
      ...card,
      question: 'q2',
      tags: ['messaging::rabbitmq'],
      updatedAt: later,
      state: 'review',
      reps: 3,
      source: 'otro',
      createdAt: later,
    })
    const found = repository.find('k7m2')
    closeStore(store)

    expect(found).toMatchObject({
      question: 'q2',
      tags: ['messaging::rabbitmq'],
      updatedAt: later,
    })
    expect(selectAll(path, kept)).toEqual(before)
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

  it('archive sets the card archived and records the reason and the instant, together', async () => {
    const at = new Date(LATER)

    await withSavedCard((repository) => {
      repository.archive('k7m2', 'ya no lo uso', at)

      expect(repository.find('k7m2')).toMatchObject({ status: 'archived' })
      expect(repository.archiveOf('k7m2')).toEqual({ reason: 'ya no lo uso', at })
      expect(repository.active()).toEqual([])
    })

    expect(selectAll(path, STATUS_CHANGES)).toEqual([ARCHIVED_ROW])
  })

  it('archive with a blank reason leaves the card active and records nothing', async () => {
    await withSavedCard((repository) => {
      expect(() => repository.archive('k7m2', '  ', new Date(LATER))).toThrow()
      expect(repository.find('k7m2')).toMatchObject({ status: 'active' })
      expect(repository.archiveOf('k7m2')).toBeNull()
    })

    expect(selectAll(path, STATUS_CHANGES)).toEqual([])
  })

  it('restore sets the card active and records the instant without a reason', async () => {
    const restoredAt = '2026-11-11T15:00:00.000Z'

    await withSavedCard((repository) => {
      repository.archive('k7m2', 'ya no lo uso', new Date(LATER))
      repository.restore('k7m2', new Date(restoredAt))

      expect(repository.find('k7m2')).toMatchObject({ status: 'active' })
      expect(repository.archiveOf('k7m2')).toBeNull()
    })

    expect(selectAll(path, STATUS_CHANGES)).toEqual([
      ARCHIVED_ROW,
      { card_id: 'k7m2', status: 'active', reason: null, changed_at: restoredAt },
    ])
  })

  it('INV-03 the store refuses to delete or change a card status change', async () => {
    await withSavedCard((repository) => repository.archive('k7m2', 'ya no lo uso', new Date(LATER)))

    expect(() => runSql(path, 'delete from card_status_history')).toThrow(
      'card status changes are never deleted',
    )
    expect(() => runSql(path, "update card_status_history set reason = 'x'")).toThrow(
      'card status changes are never changed',
    )
    expect(selectAll(path, STATUS_CHANGES)).toEqual([ARCHIVED_ROW])
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

describe('the card_status_history table', () => {
  const change = (overrides: Record<string, string> = {}) =>
    insertSql('card_status_history', {
      card_id: VALID_CARD.id,
      status: 'archived',
      reason: 'ya no lo uso',
      changed_at: NOW,
      ...overrides,
    })

  beforeEach(() => runSql(path, insertCard()))

  it('accepts an archive with a reason and a restore without one', () => {
    runSql(path, change())
    runSql(
      path,
      "insert into card_status_history (card_id, status, changed_at) values ('k7m2', 'active', '2026-11-10T15:00:00.000Z')",
    )

    expect(selectAll(path, 'select count(*) as n from card_status_history')).toEqual([{ n: 2 }])
  })

  it.for<[string, string]>([
    [
      'an archive without a reason',
      "insert into card_status_history (card_id, status, changed_at) values ('k7m2', 'archived', '2026-11-09T15:00:00.000Z')",
    ],
    ['an archive with a blank reason', change({ reason: '  ' })],
    ['a restore with a reason', change({ status: 'active' })],
    ['a status outside active and archived', change({ status: 'deleted' })],
    ['a change of a card that does not exist', change({ card_id: 'zzzz' })],
  ])('refuses %s', ([, statement]) => {
    expect(() => runSql(path, statement)).toThrow()
    expect(selectAll(path, 'select count(*) as n from card_status_history')).toEqual([{ n: 0 }])
  })
})
