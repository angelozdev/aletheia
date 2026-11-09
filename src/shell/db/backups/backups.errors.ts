export class ICloudDriveNotFoundError extends Error {
  readonly root: string

  constructor(root: string) {
    super(`iCloud Drive not found at ${root}`)
    this.name = new.target.name
    this.root = root
  }
}

export class BackupNotWrittenError extends Error {
  readonly folder: string

  constructor(folder: string, cause: Error) {
    super(`cannot write backup to ${folder}: ${cause.message}`, { cause })
    this.name = new.target.name
    this.folder = folder
  }
}
