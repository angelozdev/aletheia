import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ExitCode, REPO_ROOT } from '#shell/cli'
import { cliOnTempStore } from '../run-cli/run-cli.ts'
import {
  EMPTY_DECK_ERRORS,
  ERROR_LINE,
  HELP_COMMAND,
  NAMED_COMMAND,
  PLACEHOLDERS,
  QUOTED,
  SH_BLOCK,
  SHOWN_COMMAND,
  SKILLS_NOW,
  TRIGGER_LIST,
} from './skills.constants.ts'
import type { ShownCommand, SkillFile } from './skills.types.ts'

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

export function triggersOf(description: string): string[] {
  const list = TRIGGER_LIST.exec(description)?.[1] ?? ''
  return [...list.matchAll(QUOTED)].map(([, trigger]) => trigger ?? '')
}

function withoutIndent(indent: string, body: string): string {
  const lines = body.split('\n').map((line) => line.slice(indent.length))
  return lines.join('\n')
}

function argvOf(args: string): string[] {
  const words = args.split(' ')
  return words.map((word) => PLACEHOLDERS[word] ?? word)
}

function commandsIn(body: string): ShownCommand[] {
  const matches = [...body.matchAll(SHOWN_COMMAND)]
  return matches.map(([, args = '', stdin = '']) => ({ argv: argvOf(args), stdin }))
}

function shownCommands(text: string): ShownCommand[] {
  const blocks = [...text.matchAll(SH_BLOCK)]
  const bodies = blocks.map(([, indent = '', body = '']) => withoutIndent(indent, body))
  return bodies.flatMap(commandsIn)
}

async function refusal({ argv, stdin }: ShownCommand): Promise<string | undefined> {
  const { code, stderr } = await cliOnTempStore({ clock: () => SKILLS_NOW }).run(argv, stdin)
  const emptyDeck = EMPTY_DECK_ERRORS.some((error) => error.test(stderr))
  if (code === ExitCode.Success || emptyDeck) return undefined
  const error = ERROR_LINE.exec(stderr)?.[0] ?? stderr
  return `aletheia ${argv.join(' ')}: ${error}`
}

export async function refusedCommands(text: string): Promise<string[]> {
  const commands = shownCommands(text)
  const refusals = await Promise.all(commands.map(refusal))
  return refusals.filter((refused) => refused !== undefined)
}

async function commandsUnder(parents: string[]): Promise<string[]> {
  const { stdout } = await cliOnTempStore().run([...parents, '--help'])
  return [...stdout.matchAll(HELP_COMMAND)].map(([, name]) => name ?? '')
}

async function isKnown(words: string[]): Promise<boolean> {
  const checks = words.map(async (word, index) => {
    const parents = words.slice(0, index)
    const names = await commandsUnder(parents)
    return names.includes(word)
  })
  const known = await Promise.all(checks)
  return known.every(Boolean)
}

export async function unknownCommands(text: string): Promise<string[]> {
  const matches = [...text.matchAll(NAMED_COMMAND)]
  const named = new Set(matches.map(([, words = '']) => words))
  const checks = [...named].map(async (words) => {
    const known = await isKnown(words.split(' '))
    return known ? undefined : `aletheia ${words}`
  })
  const unknown = await Promise.all(checks)
  return unknown.filter((command) => command !== undefined)
}
