export function countingDraw(): (bound: number) => number {
  let draws = 0
  return (bound) => draws++ % bound
}
