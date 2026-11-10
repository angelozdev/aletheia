import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, symlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, it, type ExpectStatic } from 'vitest'
import { REPO_ROOT } from '#shell/cli'
import { tempDir } from '../support/temp-dir/temp-dir.ts'
import type { OnTestFinished } from '../support/temp-dir/temp-dir.types.ts'
import type { LintResult } from './lint.types.ts'

const oxlint = join(REPO_ROOT, 'node_modules', '.bin', 'oxlint')

function runOxlint(cwd: string, roots: string[]): Promise<LintResult> {
  return new Promise((resolve) => {
    const child = spawn(oxlint, roots, { cwd })
    let output = ''
    child.stdout.on('data', (chunk: Buffer) => (output += chunk.toString()))
    child.stderr.on('data', (chunk: Buffer) => (output += chunk.toString()))
    child.on('close', (status) => resolve({ status, output }))
  })
}

function lintFixture(
  onFinished: OnTestFinished,
  files: Record<string, string>,
): Promise<LintResult> {
  const dir = tempDir('aletheia-lint-', onFinished)
  cpSync(join(REPO_ROOT, '.oxlintrc.json'), join(dir, '.oxlintrc.json'))
  if (existsSync(join(REPO_ROOT, 'tools')))
    cpSync(join(REPO_ROOT, 'tools'), join(dir, 'tools'), { recursive: true })
  symlinkSync(join(REPO_ROOT, 'node_modules'), join(dir, 'node_modules'))
  for (const [path, content] of Object.entries(files)) {
    const file = join(dir, path)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, content)
  }
  return runOxlint(dir, [...new Set(Object.keys(files).map((path) => path.split('/')[0]))])
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

const sqliteImport =
  "import { DatabaseSync } from 'node:sqlite'\nexport const open = DatabaseSync\n"

const drizzleImport = "import { sql } from 'drizzle-orm'\nexport const query = sql\n"

describe.concurrent('lint', () => {
  it('000-US5-AS2 lint fails naming a src/core file that imports node:*', async ({
    expect,
    onTestFinished,
  }) => {
    const result = await lintFixture(onTestFinished, {
      [coreFile]: "import { readFileSync } from 'node:fs'\nexport const read = readFileSync\n",
    })

    expectFailure(expect, result, coreFile)
  })

  it('fails when a src/core file imports drizzle-orm', async ({ expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, {
      [coreFile]: drizzleImport,
    })

    expectFailure(expect, result, coreFile)
  })

  it('fails when a src/core file imports #shell/*', async ({ expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, {
      [coreFile]: "import { openStore } from '#shell/db'\nexport const open = openStore\n",
    })

    expectFailure(expect, result, coreFile)
  })

  it('000-US5-AS2 lint fails naming a file with a comment', async ({ expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, {
      'src/shell/sample.ts': '// note\nexport const a = 1\n',
      'src/shell/other.ts': '/* note */\nexport const b = 2\n',
    })

    expectFailure(expect, result, 'src/shell/sample.ts', 'src/shell/other.ts')
  })

  it('passes a file whose only comment-like line is the shebang', async ({
    expect,
    onTestFinished,
  }) => {
    const result = await lintFixture(onTestFinished, {
      'src/shell/bin.ts': '#!/usr/bin/env node\nexport const a = 1\n',
    })

    expectPass(expect, result, 'src/shell/bin.ts')
  })

  it('reports an oxlint-disable directive as a comment', async ({ expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, {
      'src/shell/sample.ts': '// oxlint-disable\nexport const a = 1\n',
    })

    expectFailure(expect, result, 'src/shell/sample.ts')
  })

  it.for([
    ['node:sqlite', sqliteImport],
    ['drizzle-orm', drizzleImport],
  ])(
    'fails when src/shell/cli imports %s and passes when src/shell/db does',
    async ([, source], { expect, onTestFinished }) => {
      const [outside, inside] = await Promise.all([
        lintFixture(onTestFinished, { 'src/shell/cli/sample.ts': source }),
        lintFixture(onTestFinished, { 'src/shell/db/sample.ts': source }),
      ])

      expectFailure(expect, outside, 'src/shell/cli/sample.ts')
      expectPass(expect, inside, 'src/shell/db/sample.ts')
    },
  )

  const callHelpers = ['f', 'g', 'h']
    .map((name) => `export const ${name} = (...x: unknown[]) => x\n`)
    .join('')

  it.for([
    ['three calls deep', 'export const a = f(g(h(1)))\n'],
    ['three calls deep through await', 'export async function a() { return f(g(await h(1))) }\n'],
    ['three calls deep through new', 'export const a = f(g(new Date(1)))\n'],
  ])('fails a call nested %s', async ([, code], { expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, { 'src/shell/sample.ts': callHelpers + code })

    expectFailure(expect, result, 'no-nested-calls')
  })

  it.for([
    ['two calls deep', 'export const a = f(g(1))\n'],
    ['two calls deep through await', 'export async function a() { return f(await g(1)) }\n'],
    ['calls chained on a call', 'export const a = f(g(1)).map(h)\n'],
    ['calls inside a callback', 'export const a = f(() => g(h(1)))\n'],
  ])('passes a call %s', async ([, code], { expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, { 'src/shell/sample.ts': callHelpers + code })

    expectPass(expect, result, 'src/shell/sample.ts')
  })

  const confinedLibraries = [
    {
      library: 'date-fns',
      home: 'src/core/time',
      source: "import { parseISO } from 'date-fns'\nexport const parse = parseISO\n",
    },
    {
      library: '@date-fns/tz',
      home: 'src/core/time',
      source: "import { TZDate } from '@date-fns/tz'\nexport const Zoned = TZDate\n",
    },
    {
      library: 'ts-fsrs',
      home: 'src/core/scheduling',
      source: "import { fsrs } from 'ts-fsrs'\nexport const scheduler = fsrs\n",
    },
  ]

  it.for(confinedLibraries)(
    'fails when a file outside $home imports $library',
    async ({ source }, { expect, onTestFinished }) => {
      const outside = ['src/core/sample/sample.ts', 'src/shell/db/sample/sample.ts']

      const results = await Promise.all(
        outside.map((path) => lintFixture(onTestFinished, { [path]: source })),
      )

      results.forEach((result, index) => expectFailure(expect, result, outside[index]))
    },
  )

  it.for(confinedLibraries)(
    'passes when $home imports $library',
    async ({ home, source }, { expect, onTestFinished }) => {
      const inside = `${home}/sample.ts`

      expectPass(expect, await lintFixture(onTestFinished, { [inside]: source }), inside)
    },
  )

  it('fails a file name that is not kebab-case', async ({ expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, {
      'src/shell/SampleFile.ts': 'export const a = 1\n',
    })

    expectFailure(expect, result, 'filename-case')
  })

  it('fails a function with cognitive complexity above 15', async ({ expect, onTestFinished }) => {
    const nested = (depth: number): string =>
      depth === 0 ? 'return 1' : `if (n > ${depth}) { ${nested(depth - 1)} }`
    const result = await lintFixture(onTestFinished, {
      'src/shell/complex.ts': `export function complex(n: number) { ${nested(6)}; return 0 }\n`,
    })

    expectFailure(expect, result, 'cognitive-complexity')
  })

  it('passes when a src/shell/db file imports node:fs', async ({ expect, onTestFinished }) => {
    const result = await lintFixture(onTestFinished, {
      'src/shell/db/sample.ts':
        "import { readFileSync } from 'node:fs'\nexport const read = readFileSync\n",
    })

    expectPass(expect, result, 'src/shell/db/sample.ts')
  })

  it('tests/support/store may import node:sqlite but not drizzle-orm', async ({
    expect,
    onTestFinished,
  }) => {
    const storeFile = 'tests/support/store/sample.ts'

    const [sqlite, drizzle] = await Promise.all([
      lintFixture(onTestFinished, { [storeFile]: sqliteImport }),
      lintFixture(onTestFinished, { [storeFile]: drizzleImport }),
    ])

    expectPass(expect, sqlite, storeFile)
    expectFailure(expect, drizzle, storeFile)
  })

  const mkdtempSyncImport =
    "import { mkdtempSync } from 'node:fs'\nexport const make = mkdtempSync\n"

  it.for([
    ['mkdtempSync from node:fs', mkdtempSyncImport],
    ['mkdtemp from node:fs', "import { mkdtemp } from 'node:fs'\nexport const make = mkdtemp\n"],
    [
      'mkdtemp from node:fs/promises',
      "import { mkdtemp } from 'node:fs/promises'\nexport const make = mkdtemp\n",
    ],
  ])(
    'fails when a test file imports %s instead of using tempDir',
    async ([, source], { expect, onTestFinished }) => {
      const testFiles = [
        'src/shell/cli/sample.test.ts',
        'src/shell/db/sample.test.ts',
        'tests/sample/sample.test.ts',
      ]

      const results = await Promise.all(
        testFiles.map((path) => lintFixture(onTestFinished, { [path]: source })),
      )

      results.forEach((result, index) => expectFailure(expect, result, testFiles[index]))
    },
  )

  it('passes mkdtempSync in tests/support/temp-dir and in non-test files', async ({
    expect,
    onTestFinished,
  }) => {
    const allowedFiles = ['tests/support/temp-dir/sample.ts', 'src/shell/release/sample.ts']

    const results = await Promise.all(
      allowedFiles.map((path) => lintFixture(onTestFinished, { [path]: mkdtempSyncImport })),
    )

    results.forEach((result, index) => expectPass(expect, result, allowedFiles[index]))
  })
})
