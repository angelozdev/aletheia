import type { CliContext } from '../../main/main.types.ts'

export type Release = { version: string; commit: string; repoRoot: string }

type Vars = Record<string, string | undefined>

type Invocation = { vars: Vars; home: string }

export type SourceInvocation = Invocation & { repoRoot: string }

export type ReleasedInvocation = Invocation & { release: Release; entryDir: string }

export type InvocationContext = Omit<CliContext, 'stdout' | 'stderr'>
