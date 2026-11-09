export class BackupsDisabledError extends Error {
  constructor() {
    super('backups are disabled here (under vitest)')
    this.name = new.target.name
  }
}
