import {
  COMBINING_MARKS,
  COMMON_WORDS,
  LONG_PLURAL,
  MIN_TERM_LENGTH,
  NOT_A_TERM_CHARACTER,
  SHORT_PLURAL,
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
