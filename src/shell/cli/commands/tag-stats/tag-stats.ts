import { EVER, PROGRESS_WINDOW_DAYS, tagProgress } from '#core/progress'
import { startOfToday, startOfTomorrow, startOfWindow } from '#core/time'
import { StoreCardRepository, StoreReviewRepository } from '#shell/db'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

export const tagStatsCommand: CliCommand = {
  group: 'tag',
  name: 'stats',
  description: 'give each tag in use and the deck their cards, new cards and cards due today',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const now = context.clock()
      return tagProgress({
        cards: new StoreCardRepository(store).active(),
        reviews: new StoreReviewRepository(store).since(EVER),
        today: startOfToday(now, context.timeZone),
        tomorrow: startOfTomorrow(now, context.timeZone),
        windowStart: startOfWindow(now, PROGRESS_WINDOW_DAYS, context.timeZone),
      })
    }),
}
