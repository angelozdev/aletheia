import { BUILT_IN_SETTINGS } from './settings.constants.ts'
import type { Settings, StoredSettings } from './settings.types.ts'

export function settingsFrom(oneSession: Partial<Settings>, stored: StoredSettings): Settings {
  const keys = Object.keys(BUILT_IN_SETTINGS) as (keyof Settings)[]
  const values = keys.map((key) => [key, oneSession[key] ?? stored[key] ?? BUILT_IN_SETTINGS[key]])
  return Object.fromEntries(values)
}
