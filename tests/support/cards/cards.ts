import { SAMPLE_DRAFT } from './cards.constants.ts'

export function taggedDrafts(tagLists: string[][]): string {
  const drafts = tagLists.map((tags) => ({ ...SAMPLE_DRAFT, tags }))
  return JSON.stringify(drafts)
}
