import { NEW_STATE, type Card } from '#core/cards'
import { policyOf, type Review } from '#core/reviews'
import { bySegments, coveredTags } from '#core/tags'
import type { CardFacts, ProgressCounts, ProgressInput, ProgressTree } from './progress.types.ts'

function hiddenToday(reviews: Review[], today: Date): Set<string> {
  const hiding = reviews.filter(
    ({ reviewedAt, flag }) => reviewedAt >= today && policyOf(flag).hidesUntilTomorrow,
  )
  return new Set(hiding.map(({ cardId }) => cardId))
}

function factsOf({ cards, reviews, today, tomorrow }: ProgressInput): Map<Card, CardFacts> {
  const hidden = hiddenToday(reviews, today)
  const facts = cards.map((card): [Card, CardFacts] => {
    const isNew = card.state === NEW_STATE
    const isDue = !isNew && card.due < tomorrow && !hidden.has(card.id)
    return [card, { isNew, isDue }]
  })
  return new Map(facts)
}

function countsOf(facts: CardFacts[]): ProgressCounts {
  return {
    cards: facts.length,
    new: facts.filter(({ isNew }) => isNew).length,
    due: facts.filter(({ isDue }) => isDue).length,
  }
}

function factsByTag(facts: Map<Card, CardFacts>): Map<string, CardFacts[]> {
  const byTag = new Map<string, CardFacts[]>()
  for (const [card, cardFacts] of facts)
    for (const tag of coveredTags(card)) {
      const covered = byTag.get(tag) ?? []
      covered.push(cardFacts)
      byTag.set(tag, covered)
    }
  return byTag
}

export function tagProgress(input: ProgressInput): ProgressTree {
  const facts = factsOf(input)
  const byTag = factsByTag(facts)
  const tags = [...byTag.keys()].toSorted(bySegments)
  const deckFacts = [...facts.values()]
  return {
    deck: countsOf(deckFacts),
    tags: tags.map((tag) => ({ tag, ...countsOf(byTag.get(tag) ?? []) })),
  }
}
