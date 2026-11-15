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
        { name: 'leech-failures', value: 3, default: true },
        { name: 'keep-months', value: 6, default: true },
      ],
    })
  })

  it('settings set saves the named settings, forgets one with default, and prints them', async () => {
    const saved = await settingsSet(['--session-size', '15', '--new-share', '20'])
    const forgot = await settingsSet(['--session-size', 'default'])

    expect(saved).toMatchObject({ code: 0 })
    expect(saved.stdout).toBe(
      [
        'settings[5]{name,value,default}:',
        '  session-size,15,false',
        '  new-per-day,10,true',
        '  new-share,20,false',
        '  leech-failures,3,true',
        '  keep-months,6,true',
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
      /error: name a setting: --session-size, --new-per-day, --new-share, --leech-failures or --keep-months\n$/,
    )
  })

  it('007-US5-AS1 settings set changes the leech failures and the keep months, default brings back 3 and 6, and a value below 1 is refused', async () => {
    const changed = await settingsSet(['--leech-failures', '6', '--keep-months', '3'])
    const refused = await settingsSet(['--leech-failures', '0', '--keep-months', 'x'])
    const changedRows = await shownJson()
    await settingsSet(['--leech-failures', 'default', '--keep-months', 'default'])

    expect(changed).toMatchObject({ code: 0 })
    expect(changedRows.settings.slice(3)).toEqual([
      { name: 'leech-failures', value: 6, default: false },
      { name: 'keep-months', value: 3, default: false },
    ])
    expect(refused).toMatchObject({ code: 1, stdout: '' })
    expect(refused.stderr).toMatch(
      /error: invalid settings: --leech-failures: must be a whole number, 1 or more, or default; --keep-months: must be a whole number, 1 or more, or default\n$/,
    )
    expect((await shownJson()).settings.slice(3)).toEqual([
      { name: 'leech-failures', value: 3, default: true },
      { name: 'keep-months', value: 6, default: true },
    ])
  })
})
