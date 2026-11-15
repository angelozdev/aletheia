import { EVER, PROGRESS_WINDOW_DAYS, tagProgress } from '#core/progress'
import { startOfToday, startOfTomorrow, startOfWindow } from '#core/time'
import { StoreCardRepository, StoreReviewRepository } from '#shell/db'
import { optionsFrom } from '../../invocation/session/session.ts'
import { topicFrom } from '../../invocation/topic/topic.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { TAG_STATS_OPTIONS } from './tag-stats.constants.ts'
import { tagStatsFlagsSchema } from './tag-stats.schema.ts'

export const tagStatsCommand: CliCommand = {
  group: 'tag',
  name: 'stats',
  argument: { name: '[tags...]', description: 'tags to narrow to; their descendants are included' },
  description:
    'give each tag in use and the deck their cards, new, due today, retention, weak cards and gaps',
  options: TAG_STATS_OPTIONS,
  run: (context, options, tags, flags) =>
    withStore(context, options, async (store) => {
      const order = optionsFrom(tagStatsFlagsSchema, flags)
      const now = context.clock()
      return tagProgress(
        {
          cards: new StoreCardRepository(store).active(),
          topic: topicFrom(tags),
          reviews: new StoreReviewRepository(store).since(EVER),
          today: startOfToday(now, context.timeZone),
          tomorrow: startOfTomorrow(now, context.timeZone),
          windowStart: startOfWindow(now, PROGRESS_WINDOW_DAYS, context.timeZone),
        },
        order,
      )
    }),
}
