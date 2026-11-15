import { describe, expect, it } from 'vitest'
import {
  instantFrom,
  minutesAfter,
  shownInstant,
  startOfToday,
  startOfTomorrow,
  startOfWindow,
  monthsBefore,
  storedInstant,
} from './time.ts'

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

  it('startOfToday is the start of the local day', () => {
    expect(startOfToday(new Date('2026-11-12T02:00:00.000Z'), 'America/Bogota').toISOString()).toBe(
      '2026-11-11T05:00:00.000Z',
    )
  })

  it('startOfTomorrow gives where the local day ends', () => {
    expect(
      startOfTomorrow(new Date('2026-11-12T02:00:00.000Z'), 'America/Bogota').toISOString(),
    ).toBe('2026-11-12T05:00:00.000Z')
    expect(
      startOfTomorrow(new Date('2026-03-29T00:30:00.000Z'), 'Europe/Madrid').toISOString(),
    ).toBe('2026-03-29T22:00:00.000Z')
  })

  it('startOfWindow of 1 day is the start of today', () => {
    const now = new Date('2026-11-15T20:00:00.000Z')

    expect(startOfWindow(now, 1, 'America/Bogota')).toEqual(startOfToday(now, 'America/Bogota'))
  })

  it('startOfWindow of 30 days is the start of the local day 29 days before today', () => {
    const now = new Date('2026-11-15T20:00:00.000Z')

    expect(startOfWindow(now, 30, 'America/Bogota').toISOString()).toBe('2026-10-17T05:00:00.000Z')
  })

  it('monthsBefore is the same local instant that many months earlier, across daylight saving', () => {
    const now = new Date('2026-11-15T20:00:00.000Z')

    expect(monthsBefore(now, 6, 'America/Bogota').toISOString()).toBe('2026-05-15T20:00:00.000Z')
    expect(
      monthsBefore(new Date('2026-12-01T15:00:00.000Z'), 6, 'America/New_York').toISOString(),
    ).toBe('2026-06-01T14:00:00.000Z')
  })

  it('minutesAfter adds minutes to an instant', () => {
    const instant = new Date('2026-11-12T02:00:00.000Z')

    expect(minutesAfter(instant, 20).toISOString()).toBe('2026-11-12T02:20:00.000Z')
  })
})
