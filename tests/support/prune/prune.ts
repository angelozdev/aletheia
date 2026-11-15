import { uniqueIdDraw } from '../draws/draws.ts'
import { cliOnTempStore } from '../run-cli/run-cli.ts'
import type { CliRun, StoreCli } from '../run-cli/run-cli.types.ts'
import { ARCHIVE_REASON, PRUNE_NOW } from './prune.constants.ts'

export function pruneCli(): StoreCli {
  return cliOnTempStore({ clock: () => PRUNE_NOW, randomIndex: uniqueIdDraw() })
}

export async function jsonOf(cli: StoreCli, argv: string[]) {
  const { stdout } = await cli.run([...argv, '--json'])
  return JSON.parse(stdout)
}

export async function listedIds(cli: StoreCli, argv: string[]): Promise<string[]> {
  const listed: { cards: { id: string }[] } = await jsonOf(cli, argv)
  return listed.cards.map(({ id }) => id)
}

export function archiveCard(
  cli: StoreCli,
  fields: Record<string, unknown>,
  argv: string[] = [],
): Promise<CliRun> {
  return cli.run(
    ['card', 'archive', ...argv],
    JSON.stringify({ reason: ARCHIVE_REASON, ...fields }),
  )
}
