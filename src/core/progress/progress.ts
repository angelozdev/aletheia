import { NEW_STATE, type Card } from '#core/cards'
import {
  isCounted,
  isFailure,
  MISSING_PREREQUISITE,
  policyOf,
  REVIEW_FLAGS,
  type Review,
} from '#core/reviews'
import { AGAIN_GRADE, GRADES } from '#core/scheduling'
import { bySegments, coveredTags, isUnder, TAG_SEPARATOR, topicCards } from '#core/tags'
import {
  DEFAULT_CARD_ORDER,
  DEFAULT_TAG_ORDER,
  PERCENT,
  TAG_FIELD,
  WEAK_FAILURES,
} from './progress.constants.ts'
import type {
  CardFacts,
  CardFilters,
  CardProgress,
  CardSortField,
  HistoryCounts,
  HistoryEntry,
  HistoryFilters,
  Comparator,
  ProgressCounts,
  ProgressInput,
  ProgressTree,
  ReviewHistory,
  SortValue,
  TagOrder,
  TagProgress,
} from './progress.types.ts'

function isGap({ flag, reviewedAt }: Review, windowStart: Date): boolean {
  return flag === MISSING_PREREQUISITE && reviewedAt >= windowStart
}

function hidesToday({ reviewedAt, flag }: Review, today: Date): boolean {
  return reviewedAt >= today && policyOf(flag).hidesUntilTomorrow
}

function latest(reviews: Review[]): Date | null {
  return reviews.reduce<Date | null>(
    (last, { reviewedAt }) => (last === null || reviewedAt > last ? reviewedAt : last),
    null,
  )
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
    lastReview: latest(reviews),
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

function isWeak({ failures }: CardFacts): boolean {
  return failures >= WEAK_FAILURES
}

function countsOf(facts: CardFacts[]): ProgressCounts {
  return {
    cards: facts.length,
    new: facts.filter(({ isNew }) => isNew).length,
    due: facts.filter(({ isDue }) => isDue).length,
    retention: retentionOf(facts),
    weak: facts.filter(isWeak).length,
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

function rankOf(value: SortValue): string | number | null {
  return value instanceof Date ? value.getTime() : value
}

function byValue<Row>(
  value: (row: Row) => SortValue,
  desc: boolean,
  tieBreak: Comparator<Row>,
): Comparator<Row> {
  return (a, b) => {
    const left = rankOf(value(a))
    const right = rankOf(value(b))
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

const BY_ID = byValue(
  (row: CardProgress) => row.card.id,
  false,
  () => 0,
)

const CARD_VALUES: Record<CardSortField, (row: CardProgress) => SortValue> = {
  id: ({ card }) => card.id,
  state: ({ card }) => card.state,
  due: ({ card }) => card.due,
  lastReview: ({ lastReview }) => lastReview,
  failures: ({ failures }) => failures,
  gaps: ({ gaps }) => gaps,
}

function lastSeen({ lastReview, card }: CardProgress): Date {
  return lastReview ?? card.createdAt
}

function matches(row: CardProgress, { weak, gaps, notReviewed }: CardFilters): boolean {
  return (
    (weak !== true || row.weak) &&
    (gaps !== true || row.gaps > 0) &&
    (notReviewed === undefined || lastSeen(row) < notReviewed)
  )
}

export function cardProgress(
  input: ProgressInput,
  filters: CardFilters,
  { field, desc } = DEFAULT_CARD_ORDER,
): CardProgress[] {
  const facts = [...factsOf(input)]
  const rows = facts.map(([card, cardFacts]) => ({
    card,
    failures: cardFacts.failures,
    gaps: cardFacts.gaps,
    weak: isWeak(cardFacts),
    lastReview: cardFacts.lastReview,
  }))
  const compare = byValue(CARD_VALUES[field], desc, BY_ID)
  return rows.filter((row) => matches(row, filters)).toSorted(compare)
}

function historyEntry(review: Review): HistoryEntry {
  return {
    card: review.cardId,
    reviewedAt: review.reviewedAt,
    grade: review.grade,
    claudeGrade: review.claudeGrade,
    flag: review.flag,
    askedQuestion: review.askedQuestion,
  }
}

function countEach<Key extends string>(
  keys: readonly Key[],
  keyOf: (entry: HistoryEntry) => Key | null,
  entries: HistoryEntry[],
): Record<string, number> {
  const counts = keys.map((key) => [key, entries.filter((entry) => keyOf(entry) === key).length])
  return Object.fromEntries(counts)
}

function historyCounts(entries: HistoryEntry[]): HistoryCounts {
  return {
    reviews: entries.length,
    grades: countEach(GRADES, ({ grade }) => grade, entries),
    flags: countEach(REVIEW_FLAGS, ({ flag }) => flag, entries),
    disputed: entries.filter(({ grade, claudeGrade }) => grade !== claudeGrade).length,
  }
}

const NEWEST_FIRST = byValue(
  (entry: HistoryEntry) => entry.reviewedAt,
  true,
  () => 0,
)

function inHistory(review: Review, input: ProgressInput, filters: HistoryFilters): boolean {
  return (
    review.reviewedAt >= input.windowStart &&
    (filters.grade === undefined || review.grade === filters.grade) &&
    (filters.flag === undefined || review.flag === filters.flag)
  )
}

function historyScope(input: ProgressInput): Card[] {
  const archived = input.archived.filter((card) =>
    card.tags.some((tag) => inTopic(tag, input.topic)),
  )
  return [...inScope(input), ...archived]
}

export function reviewHistory(input: ProgressInput, filters: HistoryFilters = {}): ReviewHistory {
  const scope = new Set(historyScope(input).map(({ id }) => id))
  const entries = input.reviews
    .filter((review) => scope.has(review.cardId) && inHistory(review, input, filters))
    .map(historyEntry)
    .toSorted(NEWEST_FIRST)
  return { counts: historyCounts(entries), reviews: entries }
}
