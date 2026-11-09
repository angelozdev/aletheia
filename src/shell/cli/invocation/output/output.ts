import { encode } from '@toon-format/toon'
import type { Output } from '../../main/main.types.ts'
import { CUSTOM_ENV } from '../env/env.constants.ts'
import type { Env } from '../env/env.types.ts'
import { ENV_PREFIX, ERROR_PREFIX, LINE_END } from './output.constants.ts'

export function writeResult(stdout: Output, result: unknown, json: boolean): void {
  stdout.write(`${json ? JSON.stringify(result) : encode(result)}${LINE_END}`)
}

export function writeEnvLine(stderr: Output, { name, dbPath }: Env): void {
  const shown = name === CUSTOM_ENV ? `${name} (${dbPath})` : name
  stderr.write(`${ENV_PREFIX}${shown}${LINE_END}`)
}

export function writeError(stderr: Output, message: string): void {
  stderr.write(`${ERROR_PREFIX}${message}${LINE_END}`)
}
