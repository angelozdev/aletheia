import { fsrs, generatorParameters, type CardInput } from 'ts-fsrs'
import type { Card } from '#core/cards'
import { CARD_STATE_OF, FSRS_RATINGS, FSRS_STATES, LEARNING_STEPS } from './scheduling.constants.ts'
import type { Grade } from './scheduling.types.ts'

const parameters = generatorParameters({ learning_steps: [...LEARNING_STEPS] })
const scheduler = fsrs(parameters)

function fsrsCard(card: Card): CardInput {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: 0,
    scheduled_days: card.scheduledDays,
    learning_steps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: FSRS_STATES[card.state],
    last_review: card.lastReview,
  }
}

export function scheduleAfter(card: Card, grade: Grade, now: Date): Card {
  const { card: next } = scheduler.next(fsrsCard(card), now, FSRS_RATINGS[grade])
  return {
    ...card,
    state: CARD_STATE_OF[next.state],
    due: next.due,
    stability: next.stability,
    difficulty: next.difficulty,
    scheduledDays: next.scheduled_days,
    learningSteps: next.learning_steps,
    reps: next.reps,
    lapses: next.lapses,
    lastReview: next.last_review ?? now,
  }
}
