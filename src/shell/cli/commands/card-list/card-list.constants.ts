import type { CommandOption } from '../../main/main.types.ts'

export const CARD_LIST_OPTIONS: CommandOption[] = [
  { flags: '--weak', description: 'only cards with 4 failures or more' },
  { flags: '--gaps', description: 'only cards with a gap in the last 30 days' },
  {
    flags: '--not-reviewed <days>',
    description: 'only cards with no review in the last <days> days',
  },
]
