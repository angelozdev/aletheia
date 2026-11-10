import { gradeCard } from '#core/reviews'
import { shownInstant } from '#core/time'
import { StoreCardRepository, StoreReviewRepository } from '#shell/db'
import { readJson } from '../../invocation/stdin/stdin.ts'
import { withStore } from '../../invocation/with-store/with-store.ts'
import type { CliCommand } from '../../main/main.types.ts'
import { reviewSchema } from './review-grade.schema.ts'

export const reviewGradeCommand: CliCommand = {
  group: 'review',
  name: 'grade',
  description: 'record a grade given as JSON on stdin and reschedule its card',
  run: (context, options) =>
    withStore(context, options, async (store) => {
      const draft = reviewSchema.parse(await readJson(context))
      const card = gradeCard(draft, {
        cards: new StoreCardRepository(store),
        reviews: new StoreReviewRepository(store),
        now: context.clock(),
      })
      return {
        card: card.id,
        grade: draft.grade,
        state: card.state,
        due: shownInstant(card.due, context.timeZone),
      }
    }),
}
