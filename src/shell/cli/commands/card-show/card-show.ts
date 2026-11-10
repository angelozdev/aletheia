import { cardById, type Card } from '#core/cards'
import { shownInstant } from '#core/time'
import { cardRepository } from '#shell/db'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'

function shownCard(card: Card, timeZone: string) {
  const shown = (instant: Date) => shownInstant(instant, timeZone)
  return {
    id: card.id,
    type: card.type,
    tags: card.tags,
    question: card.question,
    answer: card.answer,
    keyPoints: card.keyPoints,
    situation: card.situation,
    source: card.source,
    status: card.status,
    state: card.state,
    due: shown(card.due),
    lastReview: card.lastReview === null ? null : shown(card.lastReview),
    stability: card.stability,
    difficulty: card.difficulty,
    scheduledDays: card.scheduledDays,
    learningSteps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    createdAt: shown(card.createdAt),
    updatedAt: shown(card.updatedAt),
  }
}

export const cardShowCommand: CliCommand = {
  group: 'card',
  name: 'show',
  argument: { name: '<id>', description: 'the id of the card' },
  description: 'print every field of a card',
  run: (context, options, [id]) =>
    withStore(context, options, async (store) =>
      shownCard(cardById(cardRepository(store), id), context.timeZone),
    ),
}
