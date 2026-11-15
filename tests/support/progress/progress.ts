import { taggedDrafts } from '../cards/cards.ts'
import type { StoreCli } from '../run-cli/run-cli.types.ts'
import { runSql, selectAll } from '../store/store.ts'
import type { RowCounts } from './progress.types.ts'

export async function addTagged(cli: StoreCli, tagLists: string[][]): Promise<string[]> {
  const { stdout } = await cli.run(['card', 'add', '--json'], taggedDrafts(tagLists))
  return JSON.parse(stdout).ids
}

export function studied(db: string, id: string, state: string, due: string): void {
  runSql(db, `update cards set state = '${state}', due = '${due}' where id = '${id}'`)
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
