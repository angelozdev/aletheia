import type { CommandOption } from '../../main/main.types.ts'

export const LIMIT_OPTIONS: CommandOption[] = [
  { flags: '--session-size <n>', description: 'the most cards a session holds' },
  { flags: '--new-per-day <n>', description: 'the most new cards introduced per day' },
  { flags: '--new-share <percent>', description: 'the share of a session kept for new cards' },
]

export const SESSION_OPTIONS: CommandOption[] = [
  {
    flags: '--session <instant>',
    description: 'the session printed by the first list of this round',
  },
  ...LIMIT_OPTIONS,
]

export const OPTION_FLAGS: Record<string, string> = {
  session: '--session',
  sessionSize: '--session-size',
  newPerDay: '--new-per-day',
  newShare: '--new-share',
}

export const WHOLE_NUMBER = /^\d+$/

const MAX_PERCENT = 100

export const LIMIT_RULES = {
  sessionSize: { message: 'must be a whole number, 1 or more', min: 1, max: Infinity },
  newPerDay: { message: 'must be a whole number, 0 or more', min: 0, max: Infinity },
  newShare: { message: 'must be a whole number from 0 to 100', min: 0, max: MAX_PERCENT },
} as const

export const DEFAULT_VALUE = 'default'

export const OR_DEFAULT = `, or ${DEFAULT_VALUE}`

export const INSTANT_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/

export const NOT_AN_INSTANT = 'must be an instant with its offset, like 2026-11-10T10:00:00-05:00'

export const IN_THE_FUTURE = 'is in the future'
