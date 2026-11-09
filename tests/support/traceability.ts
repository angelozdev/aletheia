const idPatterns = [/\b\d{3}-US\d+-AS\d+\b/g, /\bINV-\d{2}\b/g]

function idsIn(text: string): string[] {
  return idPatterns.flatMap((pattern) => text.match(pattern) ?? [])
}

export function missingIds({ specs, tests }: { specs: string[]; tests: string[] }): string[] {
  const defined = new Set(specs.flatMap(idsIn))
  return [...defined].filter((id) => !tests.some((test) => test.includes(id))).sort()
}
