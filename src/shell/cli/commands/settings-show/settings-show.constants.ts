import type { Settings } from '#core/settings'

export const SHOWN_SETTINGS: readonly { key: keyof Settings; name: string }[] = [
  { key: 'sessionSize', name: 'session-size' },
  { key: 'newPerDay', name: 'new-per-day' },
  { key: 'newShare', name: 'new-share' },
]
