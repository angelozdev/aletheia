import type { Card } from '#core/cards'
import { searchTerms, similarCards } from '#core/similar'
import { StoreCardRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { searchSchema } from './card-search.schema.ts'

function similarItem(card: Card) {
  return {
    id: card.id,
    type: card.type,
    tags: card.tags,
    question: card.question,
    answer: card.answer,
  }
}

export const cardSearchCommand: CliCommand = {
  group: 'card',
  name: 'search',
  description: 'list the active cards most similar to the words and tags given as JSON on stdin',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const { words } = searchSchema.parse(await readJson(context))
      const matches = new StoreCardRepository(store).matching(searchTerms(words))
      return { cards: similarCards(matches).map(similarItem) }
    }),
}
