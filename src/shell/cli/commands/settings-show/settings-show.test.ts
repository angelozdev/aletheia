import { describe, expect, it } from 'vitest'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'

describe('aletheia settings show', () => {
  it('003-US4-AS1 settings show gives session size 20, new cards per day 10 and new share 10, each marked as the built-in default', async () => {
    const cli = cliOnTempStore()

    const { code, stdout } = await cli.run(['settings', 'show'])

    expect(code).toBe(0)
    expect(stdout).toBe(
      [
        'settings[3]{name,value,default}:',
        '  session-size,20,true',
        '  new-per-day,10,true',
        '  new-share,10,true',
        '',
      ].join('\n'),
    )
  })
})
