# Data Model: Capture and Review

Slice 1 adds the first domain tables. The schema is declared in TypeScript in
`src/shell/db/schema/` and `drizzle-kit generate` derives the migration, reviewed and committed
(ADR-0002). The draft below was generated and exercised in a scratch project on Node 26.13.0
(SQLite 3.54.0); decisions and their reasons are in [research.md](./research.md).

Instants are stored as UTC ISO 8601 with milliseconds (`2026-11-09T15:00:00.000Z`): fixed
width, so text order is time order. The CLI shows them in the local time of whoever runs it,
with the offset (`2026-11-09T10:00:00-05:00`); nothing local is ever stored (R7).

## Card: table `cards`

| Column | Type | Rule |
|---|---|---|
| id | text, primary key | 4 characters of `0-9a-hjkmnp-tv-z`, random (R3); quoted in chat as `#k7m2` |
| type | text | `concept`, `comparison`, `command`, `scenario` or `code` |
| question, answer, situation, source | text | not blank; stored exactly as written |
| key_points | text, a JSON array of strings | 1 to 3 items; each not blank (checked at the CLI edge) |
| status | text | `active` (default) or `archived`; nothing archives in this slice |
| due | text, instant | when the card comes back; the creation instant for a new card |
| state | text | `new` (default), `learning`, `review` or `relearning` |
| stability, difficulty | real | FSRS memory state; 0 while new |
| scheduled_days, learning_steps, reps, lapses | integer | FSRS counters; 0 while new |
| last_review | text, instant, nullable | null while new |
| created_at, updated_at | text, instant | `updated_at` moves when the content changes, so it equals `created_at` in this slice |

## Tag: table `card_tags`

| Column | Type | Rule |
|---|---|---|
| card_id | text | references `cards.id` |
| tag | text | only `a`–`z`, digits, `-` and `:` (store); full grammar at the CLI edge |

Primary key `(card_id, tag)`: a card's tags are unique. A card has at least one tag (CLI edge).
Grammar: `^[a-z0-9]+(-[a-z0-9]+)*(::[a-z0-9]+(-[a-z0-9]+)*)*$`, e.g. `messaging::redis-streams`. Tags are written in English (constitution 1.5.0), which is
the add skill's judgment; the store only knows the alphabet.

## Review: table `reviews`

One row per recorded grade, never changed and never deleted (INV-02).

| Column | Type | Rule |
|---|---|---|
| id | integer, primary key | internal, never quoted |
| card_id | text | references `cards.id` |
| grade | text | `again`, `hard`, `good` or `easy`: Angelo's final grade, the one FSRS gets |
| claude_grade | text | same four: the grade Claude gave. A dispute changed the grade when the two differ |
| state_before | text | the card's `state` when Angelo answered |
| reviewed_at | text, instant | |
| answer | text | Claude's summary of Angelo's answer: his claims, right or wrong, not his words; not blank |
| rationale | text | Claude's reason, not blank |

## Card states

The four states are FSRS's. A card keeps only its current one; each review records the state
it found (`state_before`). Measured with one 10-minute learning step (R6):

| State before | Grade | State after | Comes back in |
|---|---|---|---|
| new | Again | learning | 10 min |
| new | Hard | learning | 15 min |
| new | Good | review | 2 days |
| new | Easy | review | 8 days |
| learning | Good | review | 1 day |
| review | Again | relearning | 10 min |
| review | Hard, Good, Easy | review | days, growing with the grade |
| relearning | Good | review | 1 day |

## Due list

A pure rule in `src/core` over the active cards, the current instant and where the local day
ends (FR-004). In this order:

1. `learning` and `relearning` cards whose `due` has passed, earliest first;
2. `review` cards whose `due` falls before the local tomorrow starts, earliest first;
3. `new` cards, in the order they were saved;
4. only when 1 to 3 are empty: `learning` and `relearning` cards whose `due` is within 20
   minutes, earliest first (001-US2-AS4).

With nothing in the list, the next due instant is the earliest `due` among the other active
cards, or none on an empty deck (001-US2-AS5).

## What the store refuses

By `CHECK`, key or trigger, whatever the CLI does (each seen failing in the scratch store):

- an unknown type, state, status or grade; a blank question, answer, situation, source, review
  answer or rationale; fewer than 1 or more than 3 key points; an id outside its alphabet
- a tag with an accent, an uppercase letter or any other character; the same tag twice on a card
- a tag or a review for a card that does not exist
- deleting a card, deleting a review, changing a review (INV-02, three `BEFORE` triggers that
  `RAISE(ABORT)`); rescheduling a card is an update and passes

The CLI edge (zod) adds what SQL cannot express: the tag grammar, at least one tag, key points
that are not blank, and the message that names the card and each invalid field (001-US1-AS2).
Several cards are saved in one transaction: one refusal stores none (001-US1-AS3).

## Migrations

`migrations/<YYYYMMDDHHMMSS>_<name>/` holds `migration.sql` and drizzle-kit's `snapshot.json`.
`cards` and `card_tags` arrive with the first delivery step and `reviews` with the fourth
(plan.md); each brings a generated folder and a custom one (`drizzle-kit generate --custom`)
with its INV-02 triggers, which Drizzle's schema cannot declare. All pending folders apply at
startup in one transaction, after a backup in `prod` (ADR-0002).
