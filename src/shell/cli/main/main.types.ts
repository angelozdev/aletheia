export type Output = { write(chunk: string): unknown }

export type Vars = Record<string, string | undefined>

type Clock = () => Date

export type CliContext = {
  stdout: Output
  stderr: Output
  version: string
  vars: Vars
  clock: Clock
  backupRoot: string | null
}
