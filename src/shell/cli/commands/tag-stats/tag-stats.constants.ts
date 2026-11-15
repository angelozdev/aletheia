import type { CommandOption } from '../../main/main.types.ts'

export const TAG_STATS_OPTIONS: CommandOption[] = [
  {
    flags: '--sort <field>',
    description: 'sort siblings by tag, cards, new, due, retention, weak or gaps',
  },
  { flags: '--desc', description: 'sort from the highest down' },
]
