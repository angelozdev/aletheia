import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { newCard } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../../tests/support/cards/cards.constants.ts'
import {
  insertSql,
  openTestStore,
  runSql,
  selectAll,
} from '../../../../tests/support/store/store.ts'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'
import { StoreCardRepository } from '../cards/cards.ts'
import { closeStore } from '../database/database.ts'
import { StoreKeepRepository } from './keeps.ts'

const NOW = '2026-11-15T20:00:00.000Z'
const KEEPS = 'select card_id, reason, overlaps, kept_at from keeps order by id'

let path: string

function insertKeep(overrides: Record<string, string> = {}): string {
  return insertSql('keeps', { card_id: 'k7m2', reason: 'leech', kept_at: NOW, ...overrides })
}

beforeEach(async () => {
  path = join(tempDir('aletheia-store-'), 'store.sqlite')
  const store = await openTestStore(path)
  const now = new Date(NOW)
  new StoreCardRepository(store).saveAll([
    newCard(SAMPLE_DRAFT, 'k7m2', now),
    newCard(SAMPLE_DRAFT, 'w2ab', now),
  ])
  closeStore(store)
})

describe('StoreKeepRepository', () => {
  it('save stores the card, the reason, the other card of an overlap and the instant', async () => {
    const store = await openTestStore(path)
    const keeps = new StoreKeepRepository(store)
    const keptAt = new Date(NOW)

    keeps.save({ card: 'k7m2', reason: 'leech', overlaps: null, keptAt })
    keeps.save({ card: 'k7m2', reason: 'overlapping', overlaps: 'w2ab', keptAt })
    closeStore(store)

    expect(selectAll(path, KEEPS)).toEqual([
      { card_id: 'k7m2', reason: 'leech', overlaps: null, kept_at: NOW },
      { card_id: 'k7m2', reason: 'overlapping', overlaps: 'w2ab', kept_at: NOW },
    ])
  })

  it('INV-03 the store refuses to delete or change a keep', () => {
    runSql(path, insertKeep())

    expect(() => runSql(path, 'delete from keeps')).toThrow('keeps are never deleted')
    expect(() => runSql(path, "update keeps set reason = 'not-useful'")).toThrow(
      'keeps are never changed',
    )
    expect(selectAll(path, KEEPS)).toEqual([
      { card_id: 'k7m2', reason: 'leech', overlaps: null, kept_at: NOW },
    ])
  })
})

describe('the keeps table', () => {
  it('accepts a keep of each reason, an overlap naming another card', () => {
    for (const reason of ['leech', 'not-useful', 'outdated-situation'])
      runSql(path, insertKeep({ reason }))
    runSql(path, insertKeep({ reason: 'overlapping', overlaps: 'w2ab' }))

    expect(selectAll(path, 'select count(*) as n from keeps')).toEqual([{ n: 4 }])
  })

  it.for<[string, Record<string, string>]>([
    ['a reason outside the four', { reason: 'mastered' }],
    ['an overlap without the other card', { reason: 'overlapping' }],
    ['another card with a reason other than overlapping', { overlaps: 'w2ab' }],
    ['an overlap with itself', { reason: 'overlapping', overlaps: 'k7m2' }],
    ['an overlap with a card that does not exist', { reason: 'overlapping', overlaps: 'zzzz' }],
    ['a keep of a card that does not exist', { card_id: 'zzzz' }],
  ])('refuses %s', ([, overrides]) => {
    expect(() => runSql(path, insertKeep(overrides))).toThrow()
    expect(selectAll(path, 'select count(*) as n from keeps')).toEqual([{ n: 0 }])
  })
})
