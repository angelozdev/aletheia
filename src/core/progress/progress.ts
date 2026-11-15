import { NEW_STATE, type Card } from '#core/cards'
import { MISSING_PREREQUISITE, policyOf, REVIEW_STATE, type Review } from '#core/reviews'
import { AGAIN_GRADE } from '#core/scheduling'
import { bySegments, coveredTags, isUnder, TAG_SEPARATOR, topicCards } from '#core/tags'
import { DEFAULT_TAG_ORDER, PERCENT, TAG_FIELD, WEAK_FAILURES } from './progress.constants.ts'
import type {
  CardFacts,
  Comparator,
  ProgressCounts,
  ProgressInput,
  ProgressTree,
  SortValue,
  TagOrder,
  TagProgress,
} from './progress.types.ts'

function isCounted({ flag, stateBefore }: Review): boolean {
  return policyOf(flag).countsInStats && stateBefore === REVIEW_STATE
}

function isFailure(review: Review): boolean {
  return isCounted(review) && review.grade === AGAIN_GRADE && review.flag !== MISSING_PREREQUISITE
}

function isGap({ flag, reviewedAt }: Review, windowStart: Date): boolean {
  return flag === MISSING_PREREQUISITE && reviewedAt >= windowStart
}

function hidesToday({ reviewedAt, flag }: Review, today: Date): boolean {
  return reviewedAt >= today && policyOf(flag).hidesUntilTomorrow
}

function cardFacts(card: Card, reviews: Review[], input: ProgressInput): CardFacts {
  const isNew = card.state === NEW_STATE
  const hidden = reviews.some((review) => hidesToday(review, input.today))
  const counted = reviews.filter(
    (review) => review.reviewedAt >= input.windowStart && isCounted(review),
  )
  return {
    isNew,
    isDue: !isNew && card.due < input.tomorrow && !hidden,
    counted: counted.length,
    passed: counted.filter(({ grade }) => grade !== AGAIN_GRADE).length,
    failures: reviews.filter(isFailure).length,
    gaps: reviews.filter((review) => isGap(review, input.windowStart)).length,
  }
}

function inScope({ cards, topic }: ProgressInput): Card[] {
  return topic.length === 0 ? cards : topicCards(cards, topic)
}

function inTopic(tag: string, topic: string[]): boolean {
  return topic.length === 0 || topic.some((topicTag) => isUnder(tag, topicTag))
}

function factsOf(input: ProgressInput): Map<Card, CardFacts> {
  const byCard = Map.groupBy(input.reviews, ({ cardId }) => cardId)
  const facts = inScope(input).map((card): [Card, CardFacts] => {
    const reviews = byCard.get(card.id) ?? []
    return [card, cardFacts(card, reviews, input)]
  })
  return new Map(facts)
}

function total(facts: CardFacts[], count: (facts: CardFacts) => number): number {
  return facts.reduce((sum, cardFacts) => sum + count(cardFacts), 0)
}

function retentionOf(facts: CardFacts[]): number | null {
  const counted = total(facts, (cardFacts) => cardFacts.counted)
  const passed = total(facts, (cardFacts) => cardFacts.passed)
  return counted === 0 ? null : Math.round((passed * PERCENT) / counted)
}

function countsOf(facts: CardFacts[]): ProgressCounts {
  return {
    cards: facts.length,
    new: facts.filter(({ isNew }) => isNew).length,
    due: facts.filter(({ isDue }) => isDue).length,
    retention: retentionOf(facts),
    weak: facts.filter(({ failures }) => failures >= WEAK_FAILURES).length,
    gaps: total(facts, (cardFacts) => cardFacts.gaps),
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

function byValue<Row>(
  value: (row: Row) => SortValue,
  desc: boolean,
  tieBreak: Comparator<Row>,
): Comparator<Row> {
  return (a, b) => {
    const left = value(a)
    const right = value(b)
    if (left === right) return tieBreak(a, b)
    if (left === null) return 1
    if (right === null) return -1
    const order = left < right ? -1 : 1
    return desc ? -order : order
  }
}

function tagComparator(rows: TagProgress[], { field, desc }: TagOrder): Comparator<TagProgress> {
  const positions = new Map(rows.map((row, index) => [row, index]))
  const position = (row: TagProgress) => positions.get(row) ?? 0
  const inSegmentOrder = (a: TagProgress, b: TagProgress) => position(a) - position(b)
  const value = field === TAG_FIELD ? position : (row: TagProgress) => row[field]
  return byValue(value, desc, inSegmentOrder)
}

function parentTag(tag: string): string {
  return tag.split(TAG_SEPARATOR).slice(0, -1).join(TAG_SEPARATOR)
}

function treeOrder(rows: TagProgress[], compare: Comparator<TagProgress>): TagProgress[] {
  const tags = new Set(rows.map(({ tag }) => tag))
  const children = Map.groupBy(rows, ({ tag }) => {
    const parent = parentTag(tag)
    return tags.has(parent) ? parent : null
  })
  const below = (parent: string | null): TagProgress[] => {
    const siblings = children.get(parent) ?? []
    return siblings.toSorted(compare).flatMap((row) => [row, ...below(row.tag)])
  }
  return below(null)
}

export function tagProgress(input: ProgressInput, order = DEFAULT_TAG_ORDER): ProgressTree {
  const facts = factsOf(input)
  const byTag = factsByTag(facts)
  const tags = [...byTag.keys()].filter((tag) => inTopic(tag, input.topic)).toSorted(bySegments)
  const rows = tags.map((tag) => ({ tag, ...countsOf(byTag.get(tag) ?? []) }))
  const deckFacts = [...facts.values()]
  return { deck: countsOf(deckFacts), tags: treeOrder(rows, tagComparator(rows, order)) }
}
