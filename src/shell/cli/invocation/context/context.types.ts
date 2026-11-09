import type { CliContext, Vars } from '../../main/main.types.ts'

export type Release = { version: string; commit: string; repoRoot: string }

export type Invocation = { vars: Vars; home: string }

export type SourceInvocation = Invocation & { repoRoot: string }

export type ReleasedInvocation = Invocation & { release: Release; entryDir: string }

export type EntryDefaults = {
  version: string
  defaultEnv: string
  dataDir: string
  migrationsDir: string
}

export type InvocationContext = Omit<CliContext, 'stdout' | 'stderr'>
