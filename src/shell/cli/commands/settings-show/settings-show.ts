import { BUILT_IN_SETTINGS, type StoredSettings } from '#core/settings'
import { StoreSettingsRepository } from '#shell/db'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { SHOWN_SETTINGS } from './settings-show.constants.ts'

export function shownSettings(stored: StoredSettings) {
  return {
    settings: SHOWN_SETTINGS.map(({ key, name }) => ({
      name,
      value: stored[key] ?? BUILT_IN_SETTINGS[key],
      default: stored[key] === null,
    })),
  }
}

export const settingsShowCommand: CliCommand = {
  group: 'settings',
  name: 'show',
  description: 'print each review setting and whether it is the built-in default',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const stored = new StoreSettingsRepository(store).stored()
      return shownSettings(stored)
    }),
}
