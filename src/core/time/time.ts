import { TZDate } from '@date-fns/tz'
import { addDays, addMinutes, formatISO, parseISO, startOfDay } from 'date-fns'

export function storedInstant(instant: Date): string {
  return instant.toISOString()
}

export function instantFrom(stored: string): Date {
  return parseISO(stored)
}

export function shownInstant(instant: Date, timeZone: string): string {
  return formatISO(new TZDate(instant, timeZone))
}

export function startOfToday(now: Date, timeZone: string): Date {
  const today = startOfDay(new TZDate(now, timeZone))
  return new Date(today.getTime())
}

export function startOfTomorrow(now: Date, timeZone: string): Date {
  const today = new TZDate(now, timeZone)
  const tomorrow = startOfDay(addDays(today, 1))
  return new Date(tomorrow.getTime())
}

export function minutesAfter(instant: Date, minutes: number): Date {
  return addMinutes(instant, minutes)
}
