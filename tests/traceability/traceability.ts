import { globSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ID_PATTERNS, SPEC_FILES, TEST_FILES } from './traceability.constants.ts'
import type { TraceabilitySources } from './traceability.types.ts'

function idsIn(text: string): string[] {
  return ID_PATTERNS.flatMap((pattern) => text.match(pattern) ?? [])
}

function readFiles(root: string, patterns: string[]): string[] {
  return globSync(patterns, { cwd: root, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8'))
}

export function readTraceabilitySources(root: string): TraceabilitySources {
  return { specs: readFiles(root, SPEC_FILES), tests: readFiles(root, TEST_FILES) }
}

export function missingIds({ specs, tests }: TraceabilitySources): string[] {
  const covered = new Set(tests.flatMap(idsIn))
  const defined = new Set(specs.flatMap(idsIn))
  return [...defined].filter((id) => !covered.has(id)).sort()
}
