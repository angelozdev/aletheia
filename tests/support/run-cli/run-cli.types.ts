import type { CliContext } from '#shell/cli'

export type CliOverrides = Partial<Omit<CliContext, 'stdout' | 'stderr'>>

export type CliRun = { code: number; stdout: string; stderr: string }

export type StoreCli = { db: string; run(argv: string[], stdin?: string): Promise<CliRun> }
