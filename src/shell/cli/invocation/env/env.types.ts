import type { Vars } from '../../main/main.types.ts'

export type EnvSources = { vars: Vars }

export type Env = { name: string; dbPath: string }
