import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, it, type ExpectStatic } from 'vitest'
import { REPO_ROOT } from '#shell/cli'
import type { LintResult } from './lint.types.ts'

const oxlint = join(REPO_ROOT, 'node_modules', '.bin', 'oxlint')

function runOxlint(cwd: string): Promise<LintResult> {
  return new Promise((resolve) => {
    const child = spawn(oxlint, ['src'], { cwd })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()))
    child.on('close', (status) => resolve({ status, output }))
  })
}

function lintFixture(files: Record<string, string>): Promise<LintResult> {
  const dir = mkdtempSync(join(tmpdir(), 'aletheia-lint-'))
  cpSync(join(REPO_ROOT, '.oxlintrc.json'), join(dir, '.oxlintrc.json'))
  if (existsSync(join(REPO_ROOT, 'tools')))
    cpSync(join(REPO_ROOT, 'tools'), join(dir, 'tools'), { recursive: true })
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(dir, 'node_modules'))
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  return runOxlint(dir)
}

function expectFailure(expect: ExpectStatic, result: LintResult, ...mentions: string[]) {
  expect(result.status).not.toBe(0)
  for (const mention of mentions) expect(result.output).toContain(mention)
}

function expectPass(expect: ExpectStatic, result: LintResult, path: string) {
  expect(result.output).not.toContain(path)
  expect(result.status).toBe(0)
}

const coreFile = 'src/core/sample/sample.ts'

describe.concurrent('lint', () => {
  it('000-US5-AS2 lint fails naming a src/core file that imports node:*', async ({ expect }) => {
    const result = await lintFixture({
      [coreFile]: "import { readFileSync } from 'node:fs'\nexport const read = readFileSync\n",
    })

    expectFailure(expect, result, coreFile)
  })

  it('fails when a src/core file imports drizzle-orm', async ({ expect }) => {
    const result = await lintFixture({
      [coreFile]: "import { sql } from 'drizzle-orm'\nexport const query = sql\n",
    })

    expectFailure(expect, result, coreFile)
  })

  it('fails when a src/core file imports #shell/*', async ({ expect }) => {
    const result = await lintFixture({
      [coreFile]: "import { openStore } from '#shell/db'\nexport const open = openStore\n",
    })

    expectFailure(expect, result, coreFile)
  })

  it('000-US5-AS2 lint fails naming a file with a comment', async ({ expect }) => {
    const result = await lintFixture({
      'src/shell/sample.ts': '// note\nexport const a = 1\n',
      'src/shell/other.ts': '/* note */\nexport const b = 2\n',
    })

    expectFailure(expect, result, 'src/shell/sample.ts', 'src/shell/other.ts')
  })

  it('passes a file whose only comment-like line is the shebang', async ({ expect }) => {
    const result = await lintFixture({
      'src/shell/bin.ts': '#!/usr/bin/env node\nexport const a = 1\n',
    })

    expectPass(expect, result, 'src/shell/bin.ts')
  })

  it('reports an oxlint-disable directive as a comment', async ({ expect }) => {
    const result = await lintFixture({
      'src/shell/sample.ts': '// oxlint-disable\nexport const a = 1\n',
    })

    expectFailure(expect, result, 'src/shell/sample.ts')
  })

  it.for([
    [
      'node:sqlite',
      "import { DatabaseSync } from 'node:sqlite'\nexport const open = DatabaseSync\n",
    ],
    ['drizzle-orm', "import { sql } from 'drizzle-orm'\nexport const query = sql\n"],
  ])(
    'fails when src/shell/cli imports %s and passes when src/shell/db does',
    async ([, source], { expect }) => {
      const [outside, inside] = await Promise.all([
        lintFixture({ 'src/shell/cli/sample.ts': source }),
        lintFixture({ 'src/shell/db/sample.ts': source }),
      ])

      expectFailure(expect, outside, 'src/shell/cli/sample.ts')
      expectPass(expect, inside, 'src/shell/db/sample.ts')
    },
  )

  it('fails a file name that is not kebab-case', async ({ expect }) => {
    const result = await lintFixture({ 'src/shell/SampleFile.ts': 'export const a = 1\n' })

    expectFailure(expect, result, 'filename-case')
  })

  it('fails a function with cognitive complexity above 15', async ({ expect }) => {
    const nested = (depth: number): string =>
      depth === 0 ? 'return 1' : `if (n > ${depth}) { ${nested(depth - 1)} }`
    const result = await lintFixture({
      'src/shell/complex.ts': `export function complex(n: number) { ${nested(6)}; return 0 }\n`,
    })

    expectFailure(expect, result, 'cognitive-complexity')
  })

  it('passes when a src/shell/db file imports node:fs', async ({ expect }) => {
    const result = await lintFixture({
      'src/shell/db/sample.ts':
        "import { readFileSync } from 'node:fs'\nexport const read = readFileSync\n",
    })

    expectPass(expect, result, 'src/shell/db/sample.ts')
  })
})
