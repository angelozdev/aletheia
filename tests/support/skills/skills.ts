import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { REPO_ROOT } from '#shell/cli'
import type { SkillFile } from './skills.types.ts'

function frontmatterField(frontmatter: string, field: string): string {
  const line = frontmatter.split('\n').find((candidate) => candidate.startsWith(`${field}:`))
  return line?.slice(field.length + 1).trim() ?? ''
}

export function readSkill(path: string): SkillFile {
  const text = readFileSync(join(REPO_ROOT, path), 'utf8')
  const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(text)?.[1] ?? ''
  return {
    name: frontmatterField(frontmatter, 'name'),
    description: frontmatterField(frontmatter, 'description'),
    text,
  }
}
