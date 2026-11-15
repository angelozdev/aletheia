import { uniqueIdDraw } from '../draws/draws.ts'
import { reviewed } from '../progress/progress.ts'
import { cliOnTempStore } from '../run-cli/run-cli.ts'
import type { CliRun, StoreCli } from '../run-cli/run-cli.types.ts'
import { ARCHIVE_REASON, LEECH_TIMES, PRUNE_NOW } from './prune.constants.ts'

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

export function failed(cli: StoreCli, id: string, times = LEECH_TIMES): void {
  for (let day = 1; day <= times; day++)
    reviewed(cli.db, id, `2026-11-0${day}T15:00:00.000Z`, { grade: 'again' })
}
