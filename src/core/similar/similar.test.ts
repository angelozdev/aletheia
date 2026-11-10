import { describe, expect, it } from 'vitest'
import { newCard, type Card } from '#core/cards'
import { SAMPLE_DRAFT } from '../../../tests/support/cards/cards.constants.ts'
import { searchTerms, sharesTagFamily, similarCards } from './similar.ts'

function cardTagged(id: string, tags: string[], created = '2026-11-09T15:00:00.000Z'): Card {
  return newCard({ ...SAMPLE_DRAFT, tags }, id, new Date(created))
}

function similarIds(matches: Card[], active: Card[], tags: string[]): string[] {
  return similarCards(matches, active, tags).map(({ id }) => id)
}

describe('search terms', () => {
  it.for([
    ['Configuración', ['configuracion']],
    ['ÑANDÚ', ['nandu']],
  ])('searchTerms folds accents and case: %s', ([words, terms]) => {
    expect(searchTerms(words as string)).toEqual(terms)
  })

  it.for([
    ['¿Qué es "redis" (y `*` -a : NOT)?', ['redi', 'not']],
    ['docker-compose up', ['docker', 'compose', 'up']],
    ['[1, 10, 2].sort()', ['10', 'sort']],
  ])('searchTerms splits on anything but letters and digits: %s', ([words, terms]) => {
    expect(searchTerms(words as string)).toEqual(terms)
  })

  it.for([
    ['¿Qué diferencia hay entre el ps y el top?', ['ps', 'top']],
    ['What is the event loop', ['event', 'loop']],
  ])('searchTerms drops one-character and common words: %s', ([words, terms]) => {
    expect(searchTerms(words as string)).toEqual(terms)
  })

  it.for([
    ['consumidores', 'consumidor'],
    ['mensajes', 'mensaj'],
    ['redis', 'redi'],
    ['procesos', 'proceso'],
    ['ps', 'ps'],
    ['gas', 'gas'],
  ])('searchTerms makes plurals singular: %s', ([word, term]) => {
    expect(searchTerms(word)).toEqual([term])
  })

  it('searchTerms keeps each term once, in first-seen order', () => {
    expect(searchTerms('Docker docker DOCKER ps')).toEqual(['docker', 'ps'])
  })
})

describe('tag family', () => {
  it.for([
    [['messaging::redis-streams'], true],
    [['messaging'], true],
    [['messaging::redis-streams::pel'], true],
    [['messaging::rabbitmq'], false],
    [['docker'], false],
    [['messaging-queues'], false],
  ])(
    'sharesTagFamily matches the same tag, an ancestor or a descendant: %j',
    ([cardTags, shared]) => {
      expect(sharesTagFamily(cardTags as string[], ['messaging::redis-streams'])).toBe(shared)
    },
  )

  it('sharesTagFamily does not take a longer segment for a descendant', () => {
    expect(sharesTagFamily(['docker-compose'], ['docker'])).toBe(false)
  })
})

describe('similar cards', () => {
  const a = cardTagged('aaaa', ['docker::commands'])
  const b = cardTagged('bbbb', ['git'])
  const c = cardTagged('cccc', ['docker'])
  const d = cardTagged('dddd', ['git'])

  it('similarCards orders word matches sharing a family, other word matches, then cards sharing only a family', () => {
    expect(similarIds([b, a], [a, b, c, d], ['docker'])).toEqual(['aaaa', 'bbbb', 'cccc'])
  })

  it('similarCards lists cards sharing only a family newest first', () => {
    const older = cardTagged('oldr', ['docker'], '2026-11-01T15:00:00.000Z')
    const newer = cardTagged('newr', ['docker'], '2026-11-05T15:00:00.000Z')

    expect(similarIds([], [older, newer], ['docker'])).toEqual(['newr', 'oldr'])
  })

  it('similarCards lists a card both matched and in the family once', () => {
    expect(similarIds([a], [a], ['docker'])).toEqual(['aaaa'])
  })

  it('similarCards keeps 10', () => {
    const candidates = Array.from({ length: 12 }, (_, index) => cardTagged(`c${index}`, ['docker']))

    const matches = candidates.slice(0, 6)

    expect(similarCards(matches, candidates, ['docker'])).toHaveLength(10)
  })
})
