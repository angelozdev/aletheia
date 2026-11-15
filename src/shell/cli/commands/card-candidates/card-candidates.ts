import { candidates, kept, type Candidate, type Keep } from '#core/prune'
import { shownInstant } from '#core/time'
import { progressInput } from '../../invocation/progress/progress.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

function candidateRow(candidate: Candidate, timeZone: string) {
  const { card, reasons, failures, lastFailure, notUseful } = candidate
  const shown = (instant: Date) => shownInstant(instant, timeZone)
  return {
    id: card.id,
    question: card.question,
    tags: card.tags,
    reasons,
    failures,
    lastFailure: lastFailure === null ? null : shown(lastFailure),
    notUseful: notUseful === null ? null : { ...notUseful, at: shown(notUseful.at) },
  }
}

function keptRow(keep: Keep, timeZone: string) {
  return { ...keep, keptAt: shownInstant(keep.keptAt, timeZone) }
}

export const cardCandidatesCommand: CliCommand = {
  group: 'card',
  name: 'candidates',
  argument: { name: '[tags...]', description: 'tags to narrow to; their descendants are included' },
  description: 'list the active cards to consider pruning, with their reasons and evidence',
  run: (context, options, tags) =>
    withStore(context, options, async (store) => {
      const input = progressInput(store, context, tags)
      return {
        candidates: candidates(input).map((row) => candidateRow(row, context.timeZone)),
        kept: kept(input).map((keep) => keptRow(keep, context.timeZone)),
      }
    }),
}
