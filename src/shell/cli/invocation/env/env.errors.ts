import { DB_VAR } from './env.constants.ts'

export class NamedEnvDisabledError extends Error {
  readonly source: string
  readonly env: string

  constructor(source: string, env: string) {
    super(
      `named environments are disabled here (${source}: ${env}); set ${DB_VAR} to a temporary file`,
    )
    this.name = new.target.name
    this.source = source
    this.env = env
  }
}
