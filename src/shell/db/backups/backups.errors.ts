export class ICloudDriveNotFoundError extends Error {
  readonly root: string

  constructor(root: string) {
    super(`iCloud Drive not found at ${root}`)
    this.name = new.target.name
    this.root = root
  }
}
