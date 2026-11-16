export const DEVELOPMENT_ONLY = ['pnpm aletheia', '--env', 'ALETHEIA_DB', '.sqlite']

export const ALETHEIA_SKILLS = [
  'skills/az-aletheia-add/SKILL.md',
  '.claude/skills/aletheia-review/SKILL.md',
  '.claude/skills/aletheia-prune/SKILL.md',
  '.claude/skills/aletheia-stats/SKILL.md',
]

export const SH_BLOCK = /^( *)```sh\n([\s\S]*?)\n\1```/gm

export const SHOWN_COMMAND = /^aletheia (.*?)(?: <<'JSON'\n([\s\S]*?)\nJSON)?$/gm

export const NAMED_COMMAND = /`aletheia ([a-z]+(?: [a-z]+)?)/g

export const HELP_COMMAND = /^ {2}([a-z]+)\b/gm

export const PLACEHOLDERS: Record<string, string> = { '<tags>': 'messaging', '<id>': 'k7m2' }

export const EMPTY_DECK_ERRORS = [
  /^error: card "[^"]+" not found$/m,
  /^error: no active card under /m,
]

export const ERROR_LINE = /^error: .*$/m

export const TRIGGER_LIST = /Triggers on ((?:"[^"]+"(?:, )?)+)/

export const QUOTED = /"([^"]+)"/g

export const SKILLS_NOW = new Date('2026-11-16T15:00:00.000Z')
