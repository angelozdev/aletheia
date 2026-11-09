import { Command, CommanderError } from '@commander-js/extra-typings'

type Output = { write(chunk: string): unknown }

export type CliContext = { stdout: Output; stderr: Output }

function program(context: CliContext) {
  return new Command('aletheia')
    .option('--env <name>', 'use data/<name>.sqlite')
    .option('--json', 'JSON instead of TOON on stdout')
    .exitOverride()
    .configureOutput({
      writeOut: (text) => context.stdout.write(text),
      writeErr: (text) => context.stderr.write(text),
    })
}

export async function main(argv: string[], context: CliContext): Promise<number> {
  try {
    await program(context).parseAsync(argv, { from: 'user' })
    return 0
  } catch (error) {
    if (error instanceof CommanderError && error.exitCode === 0) return 0
    throw error
  }
}
