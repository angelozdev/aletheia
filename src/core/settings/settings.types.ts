export type Settings = {
  sessionSize: number
  newPerDay: number
  newShare: number
  leechFailures: number
  keepMonths: number
}

export type StoredSettings = { [K in keyof Settings]: number | null }

export interface SettingsRepository {
  stored(): StoredSettings
  save(changes: Partial<StoredSettings>): StoredSettings
}
