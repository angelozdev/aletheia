import type { CommandOption } from '../../main/main.types.ts'

export const OVERLAPS_GOES_WITH_OVERLAPPING = 'goes with --reason overlapping, and only with it'

export const CARD_KEEP_OPTIONS: CommandOption[] = [
  {
    flags: '--reason <reason>',
    description: 'why Angelo keeps it: leech, not-useful, outdated-situation or overlapping',
  },
  { flags: '--overlaps <id>', description: 'the card it overlaps, with --reason overlapping only' },
]
