import { FIELD_SEPARATOR } from '../../invocation/input/input.constants.ts'
import { NAME_A_SETTING } from './settings-set.constants.ts'

export class InvalidSettingsError extends Error {
  constructor(messages: string[]) {
    super(`invalid settings: ${messages.join(FIELD_SEPARATOR)}`)
    this.name = new.target.name
  }
}

export class NoSettingNamedError extends Error {
  constructor() {
    super(NAME_A_SETTING)
    this.name = new.target.name
  }
}
