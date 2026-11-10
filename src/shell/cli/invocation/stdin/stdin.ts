import { text } from 'node:stream/consumers'
import type { CliContext } from '../../main/main.types.ts'
import { InvalidJsonError } from './stdin.errors.ts'

export async function readJson(context: CliContext): Promise<unknown> {
  const input = await context.stdin()
  try {
    return JSON.parse(input)
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error
    throw new InvalidJsonError(error)
  }
}

export function processStdin(): Promise<string> {
  return process.stdin.isTTY ? Promise.resolve('') : text(process.stdin)
}
