import { beforeEach, describe, expect, it } from 'vitest'
import { cliOnTempStore } from '../../../../../tests/support/run-cli/run-cli.ts'
import type { StoreCli } from '../../../../../tests/support/run-cli/run-cli.types.ts'

let cli: StoreCli

beforeEach(() => {
  cli = cliOnTempStore()
})

function settingsSet(flags: string[]) {
  return cli.run(['settings', 'set', ...flags])
}

async function shownJson() {
  const { stdout } = await cli.run(['settings', 'show', '--json'])
  return JSON.parse(stdout)
}

describe('aletheia settings set', () => {
  it('003-US4-AS3 settings set refuses an out-of-range value, naming each, and changes nothing', async () => {
    await settingsSet(['--session-size', '15'])

    const refused = await settingsSet([
      '--session-size',
      '0',
      '--new-per-day',
      '-1',
      '--new-share',
      '101',
    ])

    expect(refused).toMatchObject({ code: 1, stdout: '' })
    expect(refused.stderr).toMatch(
      /error: invalid settings: --session-size: must be a whole number, 1 or more, or default; --new-per-day: must be a whole number, 0 or more, or default; --new-share: must be a whole number from 0 to 100, or default\n$/,
    )
    expect(await shownJson()).toEqual({
      settings: [
        { name: 'session-size', value: 15, default: false },
        { name: 'new-per-day', value: 10, default: true },
        { name: 'new-share', value: 10, default: true },
      ],
    })
  })

  it('settings set saves the named settings, forgets one with default, and prints them', async () => {
    const saved = await settingsSet(['--session-size', '15', '--new-share', '20'])
    const forgot = await settingsSet(['--session-size', 'default'])

    expect(saved).toMatchObject({ code: 0 })
    expect(saved.stdout).toBe(
      [
        'settings[3]{name,value,default}:',
        '  session-size,15,false',
        '  new-per-day,10,true',
        '  new-share,20,false',
        '',
      ].join('\n'),
    )
    expect(forgot.stdout).toContain('  session-size,20,true\n')
    expect(forgot.stdout).toContain('  new-share,20,false\n')
  })

  it('settings set with no setting is refused', async () => {
    const refused = await settingsSet([])

    expect(refused).toMatchObject({ code: 1, stdout: '' })
    expect(refused.stderr).toMatch(
      /error: name a setting: --session-size, --new-per-day or --new-share\n$/,
    )
  })
})
