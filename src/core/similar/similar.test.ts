import { describe, expect, it } from 'vitest'
import { searchTerms } from './similar.ts'

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
