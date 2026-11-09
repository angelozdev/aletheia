import { DB_VAR } from './env.constants.ts'

export class DatabaseNotSetError extends Error {
  constructor() {
    super(`${DB_VAR} is not set`)
    this.name = new.target.name
  }
}
