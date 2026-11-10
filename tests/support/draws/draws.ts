import { DRAWS_PER_ID } from './draws.constants.ts'

export function countingDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => draws++ % bound
}

export function distinctIdDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => Math.floor(draws++ / DRAWS_PER_ID) % bound
}
