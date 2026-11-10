import { text } from 'node:stream/consumers'
import type { CliContext } from '../../main/main.types.ts'

export async function readJson(context: CliContext): Promise<unknown> {
  return JSON.parse(await context.stdin())
}

export function processStdin(): Promise<string> {
  return process.stdin.isTTY ? Promise.resolve('') : text(process.stdin)
}
