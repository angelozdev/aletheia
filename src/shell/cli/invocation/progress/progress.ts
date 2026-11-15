import { EVER, PROGRESS_WINDOW_DAYS, type ProgressInput } from '#core/progress'
import { settingsFrom } from '#core/settings'
import { monthsBefore, startOfToday, startOfTomorrow, startOfWindow } from '#core/time'
import {
  StoreCardRepository,
  StoreKeepRepository,
  StoreReviewRepository,
  StoreSettingsRepository,
  type Store,
} from '#shell/db'
import type { CliContext } from '../../main/main.types.ts'
import { topicFrom } from '../topic/topic.ts'

export function progressInput(
  store: Store,
  context: CliContext,
  tags: string[],
  days = PROGRESS_WINDOW_DAYS,
): ProgressInput {
  const now = context.clock()
  const { leechFailures, keepMonths } = settingsFrom(
    {},
    new StoreSettingsRepository(store).stored(),
  )
  const { active = [], archived = [] } = Object.groupBy(
    new StoreCardRepository(store).all(),
    ({ status }) => status,
  )
  return {
    cards: active,
    archived,
    topic: topicFrom(tags),
    reviews: new StoreReviewRepository(store).since(EVER),
    today: startOfToday(now, context.timeZone),
    tomorrow: startOfTomorrow(now, context.timeZone),
    windowStart: startOfWindow(now, days, context.timeZone),
    leechFailures,
    keeps: new StoreKeepRepository(store).all(),
    keepStart: monthsBefore(now, keepMonths, context.timeZone),
  }
}

export function windowOf(days: number, context: CliContext): Date {
  return startOfWindow(context.clock(), days, context.timeZone)
}
