import { TZDate } from '@date-fns/tz'
import { addDays, formatISO, parseISO, startOfDay } from 'date-fns'

export function storedInstant(instant: Date): string {
  return instant.toISOString()
}

export function instantFrom(stored: string): Date {
  return parseISO(stored)
}

export function shownInstant(instant: Date, timeZone: string): string {
  return formatISO(new TZDate(instant, timeZone))
}

export function startOfTomorrow(now: Date, timeZone: string): Date {
  const today = new TZDate(now, timeZone)
  const tomorrow = startOfDay(addDays(today, 1))
  return new Date(tomorrow.getTime())
}
