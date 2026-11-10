export class CardNotFoundError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`card "${id}" not found`)
    this.name = new.target.name
    this.id = id
  }
}
