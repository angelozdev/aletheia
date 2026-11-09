import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT } from '#shell/cli'
import { tempDir } from '../support/temp-dir/temp-dir.ts'
import { missingIds, readTraceabilitySources } from './traceability.ts'

function tempTree(files: Record<string, string>): string {
  const root = tempDir('aletheia-traceability-')
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  return root
}

describe('traceability', () => {
  it('000-US5-AS3 lists the ids from a spec that no test or eval contains', () => {
    const spec =
      '1. **999-US1-AS1** Given … 2. **999-US1-AS2** Given … **INV-99** … again **999-US1-AS2**'

    const missing = missingIds({ specs: [spec], tests: ["it('999-US1-AS1 works')"] })

    expect(missing).toEqual(['999-US1-AS2', 'INV-99'])
  })

  it('does not count a longer id as covering a shorter one', () => {
    const missing = missingIds({
      specs: ['**999-US1-AS1** **999-US1-AS10**'],
      tests: ["it('999-US1-AS10 works')"],
    })

    expect(missing).toEqual(['999-US1-AS1'])
  })

  it('reads ids from specs/*/spec.md and names from *.test.ts and evals/', () => {
    const root = tempTree({
      'specs/999-x/spec.md':
        '**999-US1-AS1** **999-US1-AS2** **999-US1-AS3** **999-US1-AS4** **INV-99**',
      'specs/999-x/tasks.md': '**999-US1-AS5**',
      'src/a/deep/a.test.ts': "it('999-US1-AS2 works')",
      'src/a/a.ts': "export const name = '999-US1-AS4'",
      'tests/b/b.test.ts': "it('999-US1-AS3 works')",
      'evals/c/c.md': 'INV-99 holds',
    })

    expect(missingIds(readTraceabilitySources(root))).toEqual(['999-US1-AS1', '999-US1-AS4'])
  })

  it('every scenario and invariant id in specs/*/spec.md is named by a test or eval', () => {
    expect(missingIds(readTraceabilitySources(REPO_ROOT))).toEqual([])
  })
})
