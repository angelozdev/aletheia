export class NotACandidateError extends Error {
  readonly id: string
  readonly reason: string

  constructor(id: string, reason: string) {
    super(`card "${id}" is not a ${reason} candidate`)
    this.name = new.target.name
    this.id = id
    this.reason = reason
  }
}
