import { join } from 'node:path'
import { build } from 'rolldown'
import type { Release } from '#shell/cli'

export async function buildRelease(release: Release): Promise<void> {
  await build({
    input: join(release.repoRoot, 'src', 'shell', 'cli', 'released.ts'),
    platform: 'node',
    external: [/^node:/],
    transform: { define: { __ALETHEIA_RELEASE__: JSON.stringify(release) } },
    output: { file: join(release.repoRoot, 'dist', 'aletheia.js'), format: 'esm' },
  })
}
