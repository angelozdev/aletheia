import type { Card } from '#core/cards'
import { TAG_SEPARATOR } from './tags.constants.ts'
import type { TagCount } from './tags.types.ts'

function withAncestors(tag: string): string[] {
  const segments = tag.split(TAG_SEPARATOR)
  return segments.map((_, index) => segments.slice(0, index + 1).join(TAG_SEPARATOR))
}

function bySegments(a: string, b: string): number {
  const left = a.split(TAG_SEPARATOR)
  const right = b.split(TAG_SEPARATOR)
  for (let index = 0; index < Math.min(left.length, right.length); index++)
    if (left[index] !== right[index]) return left[index] < right[index] ? -1 : 1
  return left.length - right.length
}

export function tagTree(cards: Card[]): TagCount[] {
  const counts = new Map<string, number>()
  for (const card of cards) {
    const covered = new Set(card.tags.flatMap(withAncestors))
    for (const tag of covered) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  }
  const tags = [...counts.keys()].toSorted(bySegments)
  return tags.map((tag) => ({ tag, cards: counts.get(tag) ?? 0 }))
}
