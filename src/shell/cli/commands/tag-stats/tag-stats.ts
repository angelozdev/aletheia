import { tagProgress } from '#core/progress'
import { progressInput } from '../../invocation/progress/progress.ts'
import { optionsFrom } from '../../invocation/session/session.ts'
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
      return tagProgress(progressInput(store, context, tags), order)
    }),
}
