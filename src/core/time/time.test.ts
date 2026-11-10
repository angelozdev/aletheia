import { describe, expect, it } from 'vitest'
import { instantFrom, shownInstant, startOfTomorrow, storedInstant } from './time.ts'

describe('time', () => {
  it('storedInstant writes an instant as UTC ISO text', () => {
    const instant = new Date('2026-11-08T21:04:05.123Z')

    expect(storedInstant(instant)).toBe('2026-11-08T21:04:05.123Z')
  })

  it("shownInstant writes an instant in a zone's local time with its offset", () => {
    const instant = new Date('2026-11-12T02:00:00.000Z')

    expect(shownInstant(instant, 'America/Bogota')).toBe('2026-11-11T21:00:00-05:00')
    expect(shownInstant(instant, 'Europe/Madrid')).toBe('2026-11-12T03:00:00+01:00')
  })

  it('instantFrom reads a stored instant back', () => {
    const instant = new Date('2026-11-12T02:00:00.000Z')

    expect(instantFrom(storedInstant(instant)).getTime()).toBe(instant.getTime())
  })

  it('startOfTomorrow gives where the local day ends', () => {
    expect(
      startOfTomorrow(new Date('2026-11-12T02:00:00.000Z'), 'America/Bogota').toISOString(),
    ).toBe('2026-11-12T05:00:00.000Z')
    expect(
      startOfTomorrow(new Date('2026-03-29T00:30:00.000Z'), 'Europe/Madrid').toISOString(),
    ).toBe('2026-03-29T22:00:00.000Z')
  })
})
