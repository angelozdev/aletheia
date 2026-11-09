import { describe, expect, it } from 'vitest'
import { captureStream } from '../../../../tests/support/streams.ts'
import { main } from '../main/main.ts'
import { releasedContext, sourceContext } from './context.ts'

async function printedVersion(context: ReturnType<typeof sourceContext>) {
  const stdout = captureStream()
  const stderr = captureStream()
  const code = await main(['--version'], { ...context, stdout, stderr })
  return { code, stdout: stdout.text(), stderr: stderr.text() }
}

describe('invocation context', () => {
  it('000-US2-AS3 the release context prints <version> (<commit>) for --version', async () => {
    const context = releasedContext({
      release: { version: '0.0.0', commit: '2033257', repoRoot: '/r' },
      entryDir: '/pkg/dist',
      vars: {},
      home: '/h',
    })

    expect(await printedVersion(context)).toEqual({
      code: 0,
      stdout: '0.0.0 (2033257)\n',
      stderr: '',
    })
  })

  it('the source context prints dev', async () => {
    const context = sourceContext({ repoRoot: '/r', vars: {}, home: '/h' })

    expect(await printedVersion(context)).toEqual({ code: 0, stdout: 'dev\n', stderr: '' })
  })
})
