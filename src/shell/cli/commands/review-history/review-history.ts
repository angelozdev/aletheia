import { reviewHistory, type HistoryEntry } from '#core/progress'
import { shownInstant } from '#core/time'
import { progressInput } from '../../invocation/progress/progress.ts'
import { optionsFrom } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { DEFAULT_HISTORY_DAYS, REVIEW_HISTORY_OPTIONS } from './review-history.constants.ts'
import { reviewHistoryFlagsSchema } from './review-history.schema.ts'

function shownEntry(entry: HistoryEntry, timeZone: string) {
  return { ...entry, reviewedAt: shownInstant(entry.reviewedAt, timeZone) }
}

export const reviewHistoryCommand: CliCommand = {
  group: 'review',
  name: 'history',
  argument: { name: '[tags...]', description: 'tags to narrow to; their descendants are included' },
  description: 'list the reviews of the last days, newest first, and count them',
  options: REVIEW_HISTORY_OPTIONS,
  run: (context, options, tags, flags) =>
    withStore(context, options, async (store) => {
      const { days, ...filters } = optionsFrom(reviewHistoryFlagsSchema, flags)
      const input = progressInput(store, context, tags, days ?? DEFAULT_HISTORY_DAYS)
      const { counts, reviews } = reviewHistory(input, filters)
      return { counts, reviews: reviews.map((entry) => shownEntry(entry, context.timeZone)) }
    }),
}
