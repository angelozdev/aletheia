import { check, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { CARD_STATES, type CardState } from '#core/cards'
import { GRADES, type Grade } from '#core/scheduling'
import { cards } from '../cards/cards.schema.ts'
import { notBlank, oneOf } from '../checks/checks.ts'

export const reviews = sqliteTable(
  'reviews',
  {
    id: integer().primaryKey(),
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    grade: text().$type<Grade>().notNull(),
    claudeGrade: text('claude_grade').$type<Grade>().notNull(),
    stateBefore: text('state_before').$type<CardState>().notNull(),
    reviewedAt: text('reviewed_at').notNull(),
    answer: text().notNull(),
    rationale: text().notNull(),
  },
  (table) => [
    check('reviews_grade', oneOf(table.grade, GRADES)),
    check('reviews_claude_grade', oneOf(table.claudeGrade, GRADES)),
    check('reviews_state_before', oneOf(table.stateBefore, CARD_STATES)),
    check('reviews_answer', notBlank(table.answer)),
    check('reviews_rationale', notBlank(table.rationale)),
  ],
)
