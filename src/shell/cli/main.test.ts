import { describe, expect, it } from 'vitest'
import { captureStream } from '../../../tests/support/streams.ts'
import { main } from './main.ts'

describe('main', () => {
  it('000-US1-AS1 --help prints usage with --env and --json on stdout and exits 0', async () => {
    const stdout = captureStream()
    const stderr = captureStream()

    const code = await main(['--help'], { stdout, stderr })

    expect(code).toBe(0)
    expect(stdout.text()).toContain('Usage: aletheia')
    expect(stdout.text()).toContain('--env <name>')
    expect(stdout.text()).toContain('--json')
    expect(stderr.text()).toBe('')
  })
})
