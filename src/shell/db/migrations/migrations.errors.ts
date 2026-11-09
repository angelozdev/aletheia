export class MigrationFailedError extends Error {
  readonly migration: string

  constructor(migration: string, cause: Error) {
    super(`migration ${migration} failed: ${cause.message}`, { cause })
    this.name = new.target.name
    this.migration = migration
  }
}
