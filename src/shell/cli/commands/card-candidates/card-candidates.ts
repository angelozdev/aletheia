import { EVER, WEAK_FAILURES } from '#core/progress'
import { candidates, type Candidate } from '#core/prune'
import { shownInstant } from '#core/time'
import { StoreCardRepository, StoreReviewRepository } from '#shell/db'
import { topicFrom } from '../../invocation/topic/topic.ts'
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
      const found = candidates({
        cards: new StoreCardRepository(store).active(),
        topic: topicFrom(tags),
        reviews: new StoreReviewRepository(store).since(EVER),
        leechFailures: WEAK_FAILURES,
      })
      return { candidates: found.map((row) => candidateRow(row, context.timeZone)), kept: [] }
    }),
}
