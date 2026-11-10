import type { Card } from '#core/cards'
import {
  COMBINING_MARKS,
  COMMON_WORDS,
  LONG_PLURAL,
  MIN_TERM_LENGTH,
  NOT_A_TERM_CHARACTER,
  SHORT_PLURAL,
  SIMILAR_CARDS_LIMIT,
  TAG_SEPARATOR,
} from './similar.constants.ts'

function folded(text: string): string {
  return text.normalize('NFD').replaceAll(COMBINING_MARKS, '').toLowerCase()
}

function counts(word: string): boolean {
  return word.length >= MIN_TERM_LENGTH && !COMMON_WORDS.has(word)
}

function singular(word: string): string {
  for (const { ending, minLength } of [LONG_PLURAL, SHORT_PLURAL])
    if (word.length >= minLength && word.endsWith(ending)) return word.slice(0, -ending.length)
  return word
}

export function searchTerms(words: string): string[] {
  const terms = folded(words).split(NOT_A_TERM_CHARACTER).filter(counts).map(singular)
  return [...new Set(terms)]
}

function inFamily(a: string, b: string): boolean {
  return a === b || a.startsWith(`${b}${TAG_SEPARATOR}`) || b.startsWith(`${a}${TAG_SEPARATOR}`)
}

export function sharesTagFamily(cardTags: string[], searchTags: string[]): boolean {
  return cardTags.some((a) => searchTags.some((b) => inFamily(a, b)))
}

function newestFirst(a: Card, b: Card): number {
  return b.createdAt.getTime() - a.createdAt.getTime()
}

export function similarCards(matches: Card[], active: Card[], tags: string[]): Card[] {
  const sharesFamily = (card: Card) => sharesTagFamily(card.tags, tags)
  const matched = new Set(matches.map(({ id }) => id))
  const familyOnly = active.filter((card) => !matched.has(card.id) && sharesFamily(card))
  return [
    ...matches.filter(sharesFamily),
    ...matches.filter((card) => !sharesFamily(card)),
    ...familyOnly.toSorted(newestFirst),
  ].slice(0, SIMILAR_CARDS_LIMIT)
}
