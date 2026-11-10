import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { tagTree, topicCards } from './tags.ts'

function cardTagged(id: string, tags: string[]): Card {
  return newCard({ ...SAMPLE_DRAFT, tags }, id, new Date('2026-11-09T15:00:00.000Z'))
}

describe('tag tree', () => {
  it('tagTree expands every tag into itself and its ancestors', () => {
    expect(tagTree([cardTagged('aaaa', ['a::b::c'])])).toEqual([
      { tag: 'a', cards: 1 },
      { tag: 'a::b', cards: 1 },
      { tag: 'a::b::c', cards: 1 },
    ])
  })

  it('tagTree counts a card once per tag', () => {
    const card = cardTagged('aaaa', ['messaging::rabbitmq', 'messaging::redis-streams'])

    expect(tagTree([card])).toContainEqual({ tag: 'messaging', cards: 1 })
  })

  it('tagTree sorts by segments', () => {
    const cards = [
      cardTagged('aaaa', ['messaging-legacy']),
      cardTagged('bbbb', ['messaging::rabbitmq']),
      cardTagged('cccc', ['messaging']),
    ]

    expect(tagTree(cards).map(({ tag }) => tag)).toEqual([
      'messaging',
      'messaging::rabbitmq',
      'messaging-legacy',
    ])
  })
})

describe('topic cards', () => {
  const cards = [
    cardTagged('aaaa', ['messaging']),
    cardTagged('bbbb', ['messaging::rabbitmq']),
    cardTagged('cccc', ['messaging-legacy']),
    cardTagged('dddd', ['docker']),
  ]

  function topicIds(cards: Card[], topic: string[]): string[] {
    return topicCards(cards, topic).map(({ id }) => id)
  }

  it('topicCards keeps the cards under a topic tag or its descendants', () => {
    expect(topicIds(cards, ['messaging'])).toEqual(['aaaa', 'bbbb'])
    expect(topicIds(cards, ['messaging::rabbitmq'])).toEqual(['bbbb'])
  })

  it('topicCards lists a card once when several of its tags fall under the topic', () => {
    const card = cardTagged('aaaa', ['messaging::a', 'messaging::b'])

    expect(topicIds([card], ['messaging'])).toEqual(['aaaa'])
  })
})
