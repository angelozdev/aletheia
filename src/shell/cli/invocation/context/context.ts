import { join } from 'node:path'
import {
  DEV_VERSION,
  ICLOUD_DRIVE,
  RELEASE_DEFAULT_ENV,
  SOURCE_DEFAULT_ENV,
  VITEST_VAR,
} from './context.constants.ts'
import type {
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
  version: string,
  defaultEnv: string,
  invocation: Invocation,
): InvocationContext {
  return {
    version,
    vars: invocation.vars,
    clock: () => new Date(),
    backupRoot: backupRoot(invocation),
    defaultEnv,
    dataDir: null,
  }
}

export function sourceContext(invocation: SourceInvocation): InvocationContext {
  return invocationContext(DEV_VERSION, SOURCE_DEFAULT_ENV, invocation)
}

export function releasedContext(invocation: ReleasedInvocation): InvocationContext {
  return invocationContext(releaseVersion(invocation.release), RELEASE_DEFAULT_ENV, invocation)
}
