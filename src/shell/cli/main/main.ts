import { Command, CommanderError } from '@commander-js/extra-typings'
import { ExitCode } from './main.constants.ts'
import type { CliContext } from './main.types.ts'

function program(context: CliContext) {
  return new Command('aletheia')
    .version(context.version, '-V, --version')
    .option('--env <name>', 'use data/<name>.sqlite')
    .option('--json', 'JSON instead of TOON on stdout')
    .exitOverride()
    .configureOutput({
      writeOut: (text) => context.stdout.write(text),
      writeErr: (text) => context.stderr.write(text),
    })
}

function exitCodeOf(error: CommanderError): number {
  return error.exitCode === ExitCode.Success ? ExitCode.Success : ExitCode.Failure
}

export async function main(argv: string[], context: CliContext): Promise<number> {
  try {
    await program(context).parseAsync(argv, { from: 'user' })
    return ExitCode.Success
  } catch (error) {
    if (error instanceof CommanderError) return exitCodeOf(error)
    throw error
  }
}
