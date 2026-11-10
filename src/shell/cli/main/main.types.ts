import type { RandomIndex } from '#core/cards'
import type { COMMAND_GROUPS } from './main.constants.ts'

export type Output = { write(chunk: string): unknown }

export type Vars = Record<string, string | undefined>

type Clock = () => Date

type Stdin = () => Promise<string>

export type CliContext = {
  stdout: Output
  stderr: Output
  stdin: Stdin
  version: string
  vars: Vars
  clock: Clock
  timeZone: string
  randomIndex: RandomIndex
  defaultEnv: string
  dataDir: string | null
  migrationsDir: string
}

export type GlobalOptions = { env?: string; json?: boolean }

type CommandGroup = keyof typeof COMMAND_GROUPS

type CommandArgument = { name: string; description: string }

export type CommandOption = { flags: string; description: string }

export type Flags = Record<string, string | undefined>

export type CliCommand = {
  group?: CommandGroup
  name: string
  argument?: CommandArgument
  options?: CommandOption[]
  description: string
  run(context: CliContext, options: GlobalOptions, args: string[], flags: Flags): Promise<number>
}
