import type { StoredSettings } from '#core/settings'
import { StoreSettingsRepository } from '#shell/db'
import { LIMIT_OPTIONS } from '../../invocation/session/session.constants.ts'
import { settingFlagsSchema } from '../../invocation/session/session.schema.ts'
import { optionMessages } from '../../invocation/session/session.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand, Flags } from '../../main/main.types.ts'
import { shownSettings } from '../settings-show/settings-show.ts'
import { InvalidSettingsError, NoSettingNamedError } from './settings-set.errors.ts'

function changesFrom(flags: Flags): Partial<StoredSettings> {
  const parsed = settingFlagsSchema.safeParse(flags)
  if (!parsed.success) throw new InvalidSettingsError(optionMessages(parsed.error.issues))
  if (Object.keys(parsed.data).length === 0) throw new NoSettingNamedError()
  return parsed.data
}

export const settingsSetCommand: CliCommand = {
  group: 'settings',
  name: 'set',
  options: LIMIT_OPTIONS,
  description: 'change the review settings named; default forgets one',
  run: (context, options, _args, flags) =>
    withStore(context, options, async (store) => {
      const changes = changesFrom(flags)
      const saved = new StoreSettingsRepository(store).save(changes)
      return shownSettings(saved)
    }),
}
