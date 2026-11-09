import { describe, expect, it } from 'vitest'
import { captureStream } from '../../../tests/support/streams.ts'
import { main } from './main.ts'

async function run(argv: string[]) {
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await main(argv, { stdout, stderr, version: 'dev' })
  return { code, stdout: stdout.text(), stderr: stderr.text() }
}

describe('main', () => {
  it('000-US1-AS1 --help prints usage with --env and --json on stdout and exits 0', async () => {
    const { code, stdout, stderr } = await run(['--help'])

    expect(code).toBe(0)
    expect(stdout).toContain('Usage: aletheia')
    expect(stdout).toContain('--env <name>')
    expect(stdout).toContain('--json')
    expect(stderr).toBe('')
  })

  it('000-US2-AS3 --version from the sources prints dev and opens no store', async () => {
    const { code, stdout, stderr } = await run(['--version'])

    expect(code).toBe(0)
    expect(stdout).toBe('dev\n')
    expect(stderr).toBe('')
  })

  it('000-US1-AS5 an unknown option exits 1 naming it on stderr with nothing on stdout', async () => {
    const { code, stdout, stderr } = await run(['--nope'])

    expect(code).toBe(1)
    expect(stderr).toContain("error: unknown option '--nope'")
    expect(stdout).toBe('')
  })
})
