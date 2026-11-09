export class MigrationFailedError extends Error {
  readonly migration: string

  constructor(migration: string, cause: Error) {
    super(`migration ${migration} failed: ${cause.message}`, { cause })
    this.name = new.target.name
    this.migration = migration
  }
}

export class UnknownMigrationsError extends Error {
  readonly migrations: string[]

  constructor(migrations: string[]) {
    super(`the store has migrations this code does not know: ${migrations.join(', ')}`)
    this.name = new.target.name
    this.migrations = migrations
  }
}
