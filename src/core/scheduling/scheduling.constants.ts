import { Rating, State } from 'ts-fsrs'
import type { CardState } from '#core/cards'
import type { Grade } from './scheduling.types.ts'

export const GRADES = ['again', 'hard', 'good', 'easy'] as const

export const LEARNING_STEPS = ['10m'] as const

export const FSRS_STATES: Record<CardState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
}

export const CARD_STATE_OF: Record<State, CardState> = {
  [State.New]: 'new',
  [State.Learning]: 'learning',
  [State.Review]: 'review',
  [State.Relearning]: 'relearning',
}

export const FSRS_RATINGS = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
} as const satisfies Record<Grade, Rating>
