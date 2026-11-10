import { TZDate } from '@date-fns/tz'
import { formatISO, parseISO } from 'date-fns'

export function storedInstant(instant: Date): string {
  return instant.toISOString()
}

export function instantFrom(stored: string): Date {
  return parseISO(stored)
}

export function shownInstant(instant: Date, timeZone: string): string {
  return formatISO(new TZDate(instant, timeZone))
}
