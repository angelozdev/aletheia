import { join } from 'node:path'
import {
  DEV_VERSION,
  ICLOUD_DRIVE,
  RELEASE_DATA_FOLDER,
  RELEASE_DEFAULT_ENV,
  SOURCE_DATA_FOLDER,
  SOURCE_DEFAULT_ENV,
  VITEST_VAR,
} from './context.constants.ts'
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

function backupRoot({ vars, home }: Invocation): string | null {
  return vars[VITEST_VAR] ? null : join(home, ICLOUD_DRIVE)
}

function invocationContext(
  { version, defaultEnv, dataDir }: EntryDefaults,
  invocation: Invocation,
): InvocationContext {
  return {
    version,
    vars: invocation.vars,
    clock: () => new Date(),
    backupRoot: backupRoot(invocation),
    defaultEnv,
    dataDir,
  }
}

export function sourceContext(invocation: SourceInvocation): InvocationContext {
  return invocationContext(
    {
      version: DEV_VERSION,
      defaultEnv: SOURCE_DEFAULT_ENV,
      dataDir: join(invocation.repoRoot, SOURCE_DATA_FOLDER),
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
    },
    invocation,
  )
}
