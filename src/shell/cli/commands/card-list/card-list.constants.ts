import { DESC_OPTION } from '../../invocation/session/session.constants.ts'
import type { CommandOption } from '../../main/main.types.ts'

export const CARD_LIST_OPTIONS: CommandOption[] = [
  { flags: '--weak', description: 'only cards with 3 failures or more' },
  { flags: '--gaps', description: 'only cards with a gap in the last 30 days' },
  {
    flags: '--not-reviewed <days>',
    description: 'only cards with no review in the last <days> days',
  },
  {
    flags: '--sort <field>',
    description: 'sort by id, state, due, lastReview, failures or gaps; lastReview by default',
  },
  DESC_OPTION,
  { flags: '--content', description: 'add the key points and the situation of each card' },
]
