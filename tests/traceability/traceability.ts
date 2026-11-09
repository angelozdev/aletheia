import { ID_PATTERNS } from './traceability.constants.ts'
import type { TraceabilitySources } from './traceability.types.ts'

function idsIn(text: string): string[] {
  return ID_PATTERNS.flatMap((pattern) => text.match(pattern) ?? [])
}

export function missingIds({ specs, tests }: TraceabilitySources): string[] {
  const covered = new Set(tests.flatMap(idsIn))
  const defined = new Set(specs.flatMap(idsIn))
  return [...defined].filter((id) => !covered.has(id)).sort()
}
