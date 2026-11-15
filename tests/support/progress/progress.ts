import { taggedDrafts } from '../cards/cards.ts'
import type { StoreCli } from '../run-cli/run-cli.types.ts'
import { insertSql, runSql, selectAll } from '../store/store.ts'
import type { ReviewFields, RowCounts } from './progress.types.ts'

export async function addTagged(cli: StoreCli, tagLists: string[][]): Promise<string[]> {
  const { stdout } = await cli.run(['card', 'add', '--json'], taggedDrafts(tagLists))
  return JSON.parse(stdout).ids
}

export function studied(db: string, id: string, state: string, due: string): void {
  runSql(db, `update cards set state = '${state}', due = '${due}' where id = '${id}'`)
}

export function reviewed(db: string, id: string, reviewedAt: string, fields: ReviewFields = {}) {
  const review = {
    card_id: id,
    grade: 'good',
    claude_grade: 'good',
    state_before: 'review',
    reviewed_at: reviewedAt,
    answer: 'a',
    rationale: 'r',
    ...fields,
  }
  runSql(db, insertSql('reviews', review))
}

export function rowCounts(db: string): RowCounts {
  const [counts] = selectAll(
    db,
    `select (select count(*) from cards) as cards,
      (select count(*) from card_tags) as cardTags,
      (select count(*) from reviews) as reviews`,
  )
  return {
    cards: Number(counts.cards),
    cardTags: Number(counts.cardTags),
    reviews: Number(counts.reviews),
  }
}
