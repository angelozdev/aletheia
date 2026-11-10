import { DRAWS_PER_ID } from './draws.constants.ts'

export function countingDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => draws++ % bound
}

export function distinctIdDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => Math.floor(draws++ / DRAWS_PER_ID) % bound
}

export function uniqueIdDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => {
    const draw = draws++
    const id = Math.floor(draw / DRAWS_PER_ID)
    const place = DRAWS_PER_ID - 1 - (draw % DRAWS_PER_ID)
    return Math.floor(id / bound ** place) % bound
  }
}
