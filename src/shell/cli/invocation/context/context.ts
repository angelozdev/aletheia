import { randomInt } from 'node:crypto'
import { join } from 'node:path'
import {
  DEV_VERSION,
  MIGRATIONS_FOLDER,
  RELEASE_DATA_FOLDER,
  RELEASE_DEFAULT_ENV,
  SOURCE_DATA_FOLDER,
  SOURCE_DEFAULT_ENV,
  VITEST_VAR,
} from './context.constants.ts'
import type { Vars } from '../../main/main.types.ts'
import type {
  EntryDefaults,
  Invocation,
  InvocationContext,
  Release,
  ReleasedInvocation,
  SourceInvocation,
} from './context.types.ts'

export function releaseVersion(release: Release): string {
  return `${release.version} (${release.commit})`
}

function outsideVitest(vars: Vars, path: string): string | null {
  return vars[VITEST_VAR] ? null : path
}

function invocationContext(
  { version, defaultEnv, dataDir, migrationsDir }: EntryDefaults,
  invocation: Invocation,
): InvocationContext {
  return {
    version,
    vars: invocation.vars,
    clock: () => new Date(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    randomIndex: randomInt,
    defaultEnv,
    dataDir: outsideVitest(invocation.vars, dataDir),
    migrationsDir,
  }
}

export function sourceContext(invocation: SourceInvocation): InvocationContext {
  return invocationContext(
    {
      version: DEV_VERSION,
      defaultEnv: SOURCE_DEFAULT_ENV,
      dataDir: join(invocation.repoRoot, SOURCE_DATA_FOLDER),
      migrationsDir: join(invocation.repoRoot, MIGRATIONS_FOLDER),
    },
    invocation,
  )
}

export function releasedContext(invocation: ReleasedInvocation): InvocationContext {
  return invocationContext(
    {
      version: releaseVersion(invocation.release),
      defaultEnv: RELEASE_DEFAULT_ENV,
      dataDir: join(invocation.home, RELEASE_DATA_FOLDER),
      migrationsDir: join(invocation.entryDir, '..', MIGRATIONS_FOLDER),
    },
    invocation,
  )
}
