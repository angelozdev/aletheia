import type { Settings } from '#core/settings'

export type Scope = 'all' | string[]

export type SessionRequest = { now: Date; start: Date; limits: Partial<Settings> }
