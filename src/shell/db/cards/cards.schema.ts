import { sql } from 'drizzle-orm'
import { check, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import {
  CARD_STATES,
  CARD_STATUSES,
  CARD_TYPES,
  type CardState,
  type CardStatus,
  type CardType,
} from '#core/cards'
import { notBlank, oneOf } from '../checks/checks.ts'

export const cards = sqliteTable(
  'cards',
  {
    id: text().primaryKey(),
    type: text().$type<CardType>().notNull(),
    question: text().notNull(),
    answer: text().notNull(),
    situation: text().notNull(),
    source: text().notNull(),
    keyPoints: text('key_points').notNull(),
    status: text().$type<CardStatus>().notNull().default('active'),
    due: text().notNull(),
    state: text().$type<CardState>().notNull().default('new'),
    stability: real().notNull().default(0),
    difficulty: real().notNull().default(0),
    scheduledDays: integer('scheduled_days').notNull().default(0),
    learningSteps: integer('learning_steps').notNull().default(0),
    reps: integer().notNull().default(0),
    lapses: integer().notNull().default(0),
    lastReview: text('last_review'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    check(
      'cards_id',
      sql`length(${table.id}) = 4 AND ${table.id} NOT GLOB '*[^0-9a-hjkmnp-tv-z]*'`,
    ),
    check('cards_type', oneOf(table.type, CARD_TYPES)),
    check('cards_question', notBlank(table.question)),
    check('cards_answer', notBlank(table.answer)),
    check('cards_situation', notBlank(table.situation)),
    check('cards_source', notBlank(table.source)),
    check(
      'cards_key_points',
      sql`json_valid(${table.keyPoints}) AND json_array_length(${table.keyPoints}) BETWEEN 1 AND 3`,
    ),
    check('cards_status', oneOf(table.status, CARD_STATUSES)),
    check('cards_state', oneOf(table.state, CARD_STATES)),
  ],
)

export const cardTags = sqliteTable(
  'card_tags',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => cards.id),
    tag: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.tag] }),
    check('card_tags_tag', sql`length(${table.tag}) > 0 AND ${table.tag} NOT GLOB '*[^a-z0-9:-]*'`),
  ],
)
