import type { CommandOption } from '../../main/main.types.ts'

export const DEFAULT_HISTORY_DAYS = 7

export const REVIEW_HISTORY_OPTIONS: CommandOption[] = [
  { flags: '--days <n>', description: 'the last <n> days, counting today; 7 by default' },
  {
    flags: '--grade <grade>',
    description: "only reviews of Angelo's grade: again, hard, good or easy",
  },
  { flags: '--flag <flag>', description: 'only reviews with this flag' },
]
