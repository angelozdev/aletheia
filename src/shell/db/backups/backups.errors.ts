export class BackupNotWrittenError extends Error {
  readonly folder: string

  constructor(folder: string, cause: Error) {
    super(`cannot write backup to ${folder}: ${cause.message}`, { cause })
    this.name = new.target.name
    this.folder = folder
  }
}
