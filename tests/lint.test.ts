import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const repoRoot = join(import.meta.dirname, '..')

function lintFixture(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), 'aletheia-lint-'))
  cpSync(join(repoRoot, '.oxlintrc.json'), join(dir, '.oxlintrc.json'))
  if (existsSync(join(repoRoot, 'tools'))) cpSync(join(repoRoot, 'tools'), join(dir, 'tools'), { recursive: true })
  symlinkSync(join(repoRoot, 'node_modules'), join(dir, 'node_modules'))
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true })
    writeFileSync(join(dir, path), content)
  }
  const result = spawnSync(join(repoRoot, 'node_modules', '.bin', 'oxlint'), ['src'], { cwd: dir, encoding: 'utf8' })
  return { status: result.status, output: `${result.stdout}${result.stderr}` }
}

describe('lint', () => {
  it('000-US5-AS2 lint fails naming a src/core file that imports node:*', () => {
    const { status, output } = lintFixture({
      'src/core/sample/sample.ts': "import { readFileSync } from 'node:fs'\nexport const read = readFileSync\n",
    })

    expect(status).not.toBe(0)
    expect(output).toContain('src/core/sample/sample.ts')
  })

  it('fails when a src/core file imports drizzle-orm', () => {
    const { status, output } = lintFixture({
      'src/core/sample/sample.ts': "import { sql } from 'drizzle-orm'\nexport const query = sql\n",
    })

    expect(status).not.toBe(0)
    expect(output).toContain('src/core/sample/sample.ts')
  })

  it('fails when a src/core file imports #shell/*', () => {
    const { status, output } = lintFixture({
      'src/core/sample/sample.ts': "import { openStore } from '#shell/db'\nexport const open = openStore\n",
    })

    expect(status).not.toBe(0)
    expect(output).toContain('src/core/sample/sample.ts')
  })

  it('000-US5-AS2 lint fails naming a file with a comment', () => {
    const { status, output } = lintFixture({
      'src/shell/sample.ts': '// note\nexport const a = 1\n',
      'src/shell/other.ts': '/* note */\nexport const b = 2\n',
    })

    expect(status).not.toBe(0)
    expect(output).toContain('src/shell/sample.ts')
    expect(output).toContain('src/shell/other.ts')
  })

  it('passes a file whose only comment-like line is the shebang', () => {
    const { status, output } = lintFixture({
      'src/shell/bin.ts': '#!/usr/bin/env node\nexport const a = 1\n',
    })

    expect(output).not.toContain('src/shell/bin.ts')
    expect(status).toBe(0)
  })

  it('reports an oxlint-disable directive as a comment', () => {
    const { status, output } = lintFixture({
      'src/shell/sample.ts': '// oxlint-disable\nexport const a = 1\n',
    })

    expect(status).not.toBe(0)
    expect(output).toContain('src/shell/sample.ts')
  })

  it('passes when a src/shell/db file imports node:fs', () => {
    const { status, output } = lintFixture({
      'src/shell/db/sample.ts': "import { readFileSync } from 'node:fs'\nexport const read = readFileSync\n",
    })

    expect(output).not.toContain('src/shell/db/sample.ts')
    expect(status).toBe(0)
  })
})
