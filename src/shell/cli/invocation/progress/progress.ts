import { EVER, PROGRESS_WINDOW_DAYS, WEAK_FAILURES, type ProgressInput } from '#core/progress'
import { startOfToday, startOfTomorrow, startOfWindow } from '#core/time'
import { StoreCardRepository, StoreReviewRepository, type Store } from '#shell/db'
import type { CliContext } from '../../main/main.types.ts'
import { topicFrom } from '../topic/topic.ts'

export function progressInput(
  store: Store,
  context: CliContext,
  tags: string[],
  days = PROGRESS_WINDOW_DAYS,
): ProgressInput {
  const now = context.clock()
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
    leechFailures: WEAK_FAILURES,
  }
}

export function windowOf(days: number, context: CliContext): Date {
  return startOfWindow(context.clock(), days, context.timeZone)
}
