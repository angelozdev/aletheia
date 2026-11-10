import { describe, expect, it } from 'vitest'
import { storedInstant } from './time.ts'

describe('time', () => {
  it('storedInstant writes an instant as UTC ISO text', () => {
    expect(storedInstant(new Date('2026-11-08T21:04:05.123Z'))).toBe('2026-11-08T21:04:05.123Z')
  })
})
