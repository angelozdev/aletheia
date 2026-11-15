import type { CommandOption } from '../../main/main.types.ts'

export const NAME_A_SETTING =
  'name a setting: --session-size, --new-per-day, --new-share, --leech-failures or --keep-months'

export const PRUNE_SETTING_OPTIONS: CommandOption[] = [
  { flags: '--leech-failures <n>', description: 'the failures that make a card a leech' },
  {
    flags: '--keep-months <n>',
    description: 'the months a card kept for a reason other than leech is not proposed again',
  },
]
