import type { Card, CardArchive } from '#core/cards'
import { searchTerms, similarCards } from '#core/similar'
import { StoreCardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { EmptySearchError, InvalidSearchError } from './card-search.errors.ts'
import { searchSchema } from './card-search.schema.ts'

function searchFrom(json: unknown) {
  const parsed = searchSchema.safeParse(json)
  if (!parsed.success) throw new InvalidSearchError(parsed.error.issues)
  const { words = '', tags = [] } = parsed.data
  if (words.trim() === '' && tags.length === 0) throw new EmptySearchError()
  return { words, tags }
}

function similarItem(card: Card, archive: CardArchive | null) {
  return {
    id: card.id,
    type: card.type,
    tags: card.tags,
    question: card.question,
    answer: card.answer,
    status: card.status,
    archiveReason: archive?.reason ?? null,
  }
}

export const cardSearchCommand: CliCommand = {
  group: 'card',
  name: 'search',
  description: 'list the cards most similar to the words and tags given as JSON on stdin',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const { words, tags } = searchFrom(await readJson(context))
      const repository = new StoreCardRepository(store)
      const matches = repository.matching(searchTerms(words))
      const similar = similarCards(matches, repository.active(), tags)
      return { cards: similar.map((card) => similarItem(card, repository.archiveOf(card.id))) }
    }),
}
