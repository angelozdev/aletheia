import type { CommandOption } from '../../main/main.types.ts'

export const SESSION_OPTIONS: CommandOption[] = [
  {
    flags: '--session <instant>',
    description: 'the session printed by the first list of this round',
  },
]

export const OPTION_FLAGS: Record<string, string> = { session: '--session' }

export const INSTANT_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/

export const NOT_AN_INSTANT = 'must be an instant with its offset, like 2026-11-10T10:00:00-05:00'

export const IN_THE_FUTURE = 'is in the future'
