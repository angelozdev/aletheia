import { HELP_FLAG, INSTALLED_BIN, MAIN_BRANCH, VERSION_FLAG } from './release.constants.ts'

export class ReleaseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = new.target.name
  }
}

class ReleaseRefusedError extends ReleaseError {
  constructor(reason: string) {
    super(`release: refused: ${reason}`)
  }
}

export class NotOnMainError extends ReleaseRefusedError {
  readonly branch: string

  constructor(branch: string) {
    super(`on ${branch}, not ${MAIN_BRANCH}`)
    this.branch = branch
  }
}

export class UncommittedChangesError extends ReleaseRefusedError {
  constructor() {
    super('uncommitted changes')
  }
}

export class CheckFailedError extends ReleaseRefusedError {
  readonly check: string

  constructor(check: string) {
    super(`${check} failed`)
    this.check = check
  }
}

class SmokeRunError extends ReleaseRefusedError {
  constructor(reason: string) {
    super(`smoke run failed: ${reason}`)
  }
}

export class PackedHelpFailedError extends SmokeRunError {
  readonly status: number

  constructor(status: number) {
    super(`${HELP_FLAG} exited ${status}`)
    this.status = status
  }
}

export class PackedVersionMismatchError extends SmokeRunError {
  readonly printed: string
  readonly expected: string

  constructor(printed: string, expected: string) {
    super(`${VERSION_FLAG} printed "${printed}", expected "${expected}"`)
    this.printed = printed
    this.expected = expected
  }
}

export class PathMismatchError extends ReleaseError {
  readonly printed: string
  readonly expected: string

  constructor(printed: string, expected: string) {
    super(`release: failed: ${INSTALLED_BIN} on PATH prints "${printed}", expected "${expected}"`)
    this.printed = printed
    this.expected = expected
  }
}
