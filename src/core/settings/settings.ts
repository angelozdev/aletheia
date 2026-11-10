import { BUILT_IN_SETTINGS } from './settings.constants.ts'
import type { Settings, StoredSettings } from './settings.types.ts'

export function settingsFrom(oneSession: Partial<Settings>, stored: StoredSettings): Settings {
  return {
    sessionSize: oneSession.sessionSize ?? stored.sessionSize ?? BUILT_IN_SETTINGS.sessionSize,
    newPerDay: oneSession.newPerDay ?? stored.newPerDay ?? BUILT_IN_SETTINGS.newPerDay,
    newShare: oneSession.newShare ?? stored.newShare ?? BUILT_IN_SETTINGS.newShare,
  }
}
