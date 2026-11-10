import { describe, expect, it } from 'vitest'
import { settingsFrom } from './settings.ts'

describe('settings', () => {
  it('settingsFrom takes the one-session value, else the stored one, else the built-in', () => {
    const stored = { sessionSize: 15, newPerDay: 5, newShare: null }

    expect(settingsFrom({ sessionSize: 10 }, stored)).toEqual({
      sessionSize: 10,
      newPerDay: 5,
      newShare: 10,
    })
  })
})
