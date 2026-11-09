import type { CliContext } from '../main.ts'

export type Release = { version: string; commit: string; repoRoot: string }

type Vars = Record<string, string | undefined>

type Invocation = { vars: Vars; home: string }

type InvocationContext = Omit<CliContext, 'stdout' | 'stderr'>

export function sourceContext(_invocation: Invocation & { repoRoot: string }): InvocationContext {
  return { version: 'dev' }
}

export function releasedContext({
  release,
}: Invocation & { release: Release; entryDir: string }): InvocationContext {
  return { version: `${release.version} (${release.commit})` }
}
