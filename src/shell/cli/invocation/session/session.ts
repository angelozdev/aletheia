import type { z } from 'zod'
import type { Card } from '#core/cards'
import { sessionList } from '#core/sessions'
import { BUILT_IN_SETTINGS } from '#core/settings'
import { topicCards } from '#core/tags'
import { shownInstant, startOfToday, startOfTomorrow } from '#core/time'
import { StoreCardRepository, StoreReviewRepository, type Store } from '#shell/db'
import type { CliContext, Flags } from '../../main/main.types.ts'
import { OPTION_FLAGS } from './session.constants.ts'
import { InvalidOptionsError } from './session.errors.ts'
import { sessionFlagsSchema } from './session.schema.ts'
import type { Scope, SessionRequest } from './session.types.ts'

function dueItem(card: Card) {
  return {
    id: card.id,
    type: card.type,
    tags: card.tags,
    question: card.question,
    keyPoints: card.keyPoints,
    answer: card.answer,
  }
}

function inScope(active: Card[], scope: Scope): Card[] {
  return scope === 'all' ? active : topicCards(active, scope)
}

function earlier(a: Date, b: Date): Date {
  return a < b ? a : b
}

export function optionMessages(issues: z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => `${OPTION_FLAGS[String(issue.path[0])]}: ${issue.message}`)
}

export function sessionFrom(flags: Flags, context: CliContext): SessionRequest {
  const now = context.clock()
  const parsed = sessionFlagsSchema(now).safeParse(flags)
  if (!parsed.success) throw new InvalidOptionsError(optionMessages(parsed.error.issues))
  const { session, ...limits } = parsed.data
  return { now, start: session ?? now, limits }
}

export function listSession(
  store: Store,
  context: CliContext,
  scope: Scope,
  { now, start, limits }: SessionRequest,
) {
  const today = startOfToday(now, context.timeZone)
  const active = new StoreCardRepository(store).active()
  const reviews = new StoreReviewRepository(store).since(earlier(start, today))
  const list = sessionList({
    scope: inScope(active, scope),
    topic: scope !== 'all',
    reviews,
    now,
    today,
    tomorrow: startOfTomorrow(now, context.timeZone),
    start,
    limits: { ...BUILT_IN_SETTINGS, ...limits },
  })
  const shown = (instant: Date) => shownInstant(instant, context.timeZone)
  return {
    session: shown(start),
    count: list.cards.length,
    remaining: list.remaining,
    heldBack: list.heldBack,
    capReached: list.capReached,
    nextDue: list.nextDue === null ? null : shown(list.nextDue),
    cards: list.cards.map(dueItem),
  }
}
