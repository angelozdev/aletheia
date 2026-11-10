export class CardNotFoundError extends Error {
  readonly id: string

  constructor(id: string) {
    super(`card "${id}" not found`)
    this.name = new.target.name
    this.id = id
  }
}

export class CardIdTakenError extends Error {
  constructor() {
    super('a card id is already taken')
    this.name = new.target.name
  }
}

export class NoFreeCardIdError extends Error {
  readonly draws: number

  constructor(draws: number) {
    super(`no free card id after ${draws} draws`)
    this.name = new.target.name
    this.draws = draws
  }
}
