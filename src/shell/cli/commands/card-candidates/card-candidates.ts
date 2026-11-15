import { candidates, type Candidate } from '#core/prune'
import { shownInstant } from '#core/time'
import { progressInput } from '../../invocation/progress/progress.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

function candidateRow({ card, reasons, failures, lastFailure }: Candidate, timeZone: string) {
  return {
    id: card.id,
    question: card.question,
    tags: card.tags,
    reasons,
    failures,
    lastFailure: lastFailure === null ? null : shownInstant(lastFailure, timeZone),
  }
}

export const cardCandidatesCommand: CliCommand = {
  group: 'card',
  name: 'candidates',
  argument: { name: '[tags...]', description: 'tags to narrow to; their descendants are included' },
  description: 'list the active cards to consider pruning, with their reasons and evidence',
  run: (context, options, tags) =>
    withStore(context, options, async (store) => {
      const found = candidates(progressInput(store, context, tags))
      return { candidates: found.map((row) => candidateRow(row, context.timeZone)), kept: [] }
    }),
}
