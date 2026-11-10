import { Command, CommanderError, type CommandUnknownOpts } from '@commander-js/extra-typings'
import { backupCommand } from '../commands/backup/backup.ts'
import { cardAddCommand } from '../commands/card-add/card-add.ts'
import { cardSearchCommand } from '../commands/card-search/card-search.ts'
import { cardShowCommand } from '../commands/card-show/card-show.ts'
import { reviewDueCommand } from '../commands/review-due/review-due.ts'
import { reviewGradeCommand } from '../commands/review-grade/review-grade.ts'
import { reviewTopicCommand } from '../commands/review-topic/review-topic.ts'
import { settingsSetCommand } from '../commands/settings-set/settings-set.ts'
import { settingsShowCommand } from '../commands/settings-show/settings-show.ts'
import { tagListCommand } from '../commands/tag-list/tag-list.ts'
import { COMMAND_GROUPS, ExitCode } from './main.constants.ts'
import type { CliCommand, CliContext, Flags } from './main.types.ts'

const COMMANDS = [
  backupCommand,
  cardAddCommand,
  cardShowCommand,
  cardSearchCommand,
  tagListCommand,
  reviewDueCommand,
  reviewTopicCommand,
  reviewGradeCommand,
  settingsShowCommand,
  settingsSetCommand,
]

function program(context: CliContext) {
  return new Command('aletheia')
    .version(context.version, '-V, --version')
    .option('--env <name>', 'use <name>.sqlite in the data folder')
    .option('--json', 'JSON instead of TOON on stdout')
    .exitOverride()
    .configureOutput({
      writeOut: (text) => context.stdout.write(text),
      writeErr: (text) => context.stderr.write(text),
    })
}

type Program = ReturnType<typeof program>

function exitCodeOf(error: CommanderError): number {
  return error.exitCode === ExitCode.Success ? ExitCode.Success : ExitCode.Failure
}

function parentOf(root: Program, command: CliCommand): CommandUnknownOpts {
  if (command.group === undefined) return root
  const existing = root.commands.find((candidate) => candidate.name() === command.group)
  return existing ?? root.command(command.group).description(COMMAND_GROUPS[command.group])
}

export async function main(argv: string[], context: CliContext): Promise<number> {
  let exitCode: number = ExitCode.Success
  const root = program(context)
  for (const command of COMMANDS) {
    const registered = parentOf(root, command)
      .command(command.name)
      .description(command.description)
    if (command.argument !== undefined)
      registered.argument(command.argument.name, command.argument.description)
    for (const option of command.options ?? []) registered.option(option.flags, option.description)
    registered.action(async () => {
      const flags: Flags = registered.opts()
      exitCode = await command.run(context, root.opts(), registered.args, flags)
    })
  }
  try {
    await root.parseAsync(argv, { from: 'user' })
    return exitCode
  } catch (error) {
    if (error instanceof CommanderError) return exitCodeOf(error)
    throw error
  }
}
