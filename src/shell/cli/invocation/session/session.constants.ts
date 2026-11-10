import type { CommandOption } from '../../main/main.types.ts'

export const SESSION_OPTIONS: CommandOption[] = [
  {
    flags: '--session <instant>',
    description: 'the session printed by the first list of this round',
  },
  { flags: '--session-size <n>', description: 'the most cards this session holds' },
  { flags: '--new-per-day <n>', description: 'the most new cards introduced today' },
  { flags: '--new-share <percent>', description: 'the share of the session kept for new cards' },
]

export const OPTION_FLAGS: Record<string, string> = {
  session: '--session',
  sessionSize: '--session-size',
  newPerDay: '--new-per-day',
  newShare: '--new-share',
}

export const WHOLE_NUMBER = /^\d+$/

export const WHOLE_FROM_ONE = 'must be a whole number, 1 or more'

export const WHOLE_FROM_ZERO = 'must be a whole number, 0 or more'

export const WHOLE_PERCENT = 'must be a whole number from 0 to 100'

export const MAX_PERCENT = 100

export const INSTANT_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/

export const NOT_AN_INSTANT = 'must be an instant with its offset, like 2026-11-10T10:00:00-05:00'

export const IN_THE_FUTURE = 'is in the future'
