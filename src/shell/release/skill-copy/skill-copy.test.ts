import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { tempDir } from '../../../../tests/support/temp-dir/temp-dir.ts'
import { copySkill } from './skill-copy.ts'

let source: string
let skillsDir: string
let destination: string

function writeTree(root: string, files: Record<string, string>): void {
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(root, { recursive: true })
    writeFileSync(join(root, name), content)
  }
}

function tree(root: string): Record<string, string> {
  const names = readdirSync(root).toSorted()
  return Object.fromEntries(names.map((name) => [name, readFileSync(join(root, name), 'utf8')]))
}

beforeEach(() => {
  source = join(tempDir('aletheia-skill-source-'), 'az-aletheia-add')
  skillsDir = join(tempDir('aletheia-skills-'), 'skills')
  destination = join(skillsDir, 'az-aletheia-add')
  writeTree(source, { 'SKILL.md': 'new skill' })
})

describe('copySkill', () => {
  it('001-US1-AS7 copySkill replaces the previous copy with the source folder', () => {
    writeTree(destination, { 'SKILL.md': 'old skill', 'stale.md': 'gone' })

    const copied = copySkill({ source, skillsDir })

    expect(copied).toBe(destination)
    expect(tree(destination)).toEqual({ 'SKILL.md': 'new skill' })
    expect(readdirSync(skillsDir)).toEqual(['az-aletheia-add'])
  })

  it('creates the skills folder on a first release', () => {
    copySkill({ source, skillsDir })

    expect(tree(destination)).toEqual({ 'SKILL.md': 'new skill' })
  })

  it('replaces a partial folder left by an earlier failure', () => {
    writeTree(`${destination}.partial`, { 'half.md': 'half' })

    copySkill({ source, skillsDir })

    expect(tree(destination)).toEqual({ 'SKILL.md': 'new skill' })
    expect(readdirSync(skillsDir)).toEqual(['az-aletheia-add'])
  })

  it('001-US1-AS7 a copy that fails leaves the previous copy whole', () => {
    writeTree(destination, { 'SKILL.md': 'old skill' })
    const missing = join(tempDir('aletheia-skill-source-'), 'missing')

    expect(() => copySkill({ source: missing, skillsDir })).toThrow(
      new RegExp(
        `^${RegExp.escape(`release: failed: cannot copy the skill to ${destination}: `)}.+`,
      ),
    )
    expect(tree(destination)).toEqual({ 'SKILL.md': 'old skill' })
    expect(existsSync(`${destination}.partial`)).toBe(false)
  })
})
