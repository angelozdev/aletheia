# 0013. Cards, tags and reviews, with their rules in the store

- **Status:** proposed
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0002](0002-drizzle-over-node-sqlite-migrations-applied-at-startup.md)

## Context and problem statement

Slice 1 creates the first domain tables, and from its release they hold Angelo's real cards.
What is hard to change later is what a card is called in chat and what a review remembers;
what must never happen is a deleted card or a rewritten review (INV-02). Which tables, which
id, what does a review keep, and who enforces the rules?

## Decision drivers

- Corruption is rejected at write time, by `CHECK` where SQL can express the rule
  (Constitution III).
- Nothing is deleted, and a recorded review never changes (INV-02).
- An id short enough to quote in chat (FR-002).
- What exists only at review time is kept; statistics are derived from the log
  (Constitution VI).

## Considered options

1. Rules in the CLI only, a consecutive integer id, the spec's changed-after-dispute flag
2. Rules in the store, a random 4-character id, a review that keeps Claude's grade and the
   card's state before it

## Decision outcome

Chosen option: **2**, as written in
[the data model](../../specs/001-capture-and-review/data-model.md):

- Three tables: `cards` (content, status and FSRS state in columns, key points as a JSON
  array), `card_tags` (one row per tag, primary key on card and tag) and `reviews`.
- The card id is four random characters of `0-9a-hjkmnp-tv-z`, the primary key; a collision
  draws again. Angelo chose it over a consecutive number.
- A review keeps `claude_grade` beside `grade`, and `state_before`. Whether a dispute changed
  the grade is derived from the two grades.
- Instants are UTC ISO text. Types, grades, states, blank texts, the key-point count and the
  tag alphabet are `CHECK` constraints declared in the Drizzle schema; three triggers in a
  custom migration refuse deleting a card, deleting a review and changing a review.

### Pros and cons of the options

**Rules in the CLI only**
- Good, because one place to read them.
- Bad, because a later command with a bug could write what the rule forbids.

**Rules in the store**
- Good, because every write is checked whatever wrote it, and the refusals were seen failing
  in a scratch store (research R5).
- Bad, because the tag grammar and "at least one tag" still need the CLI edge, so the rules
  live in two places.

## Consequences

- Good: slice 5 can tell a lapse from a first-day miss and see which way disputes go; tags
  filter and group with plain SQL in slices 3 and 5.
- Bad / cost: changing the id format after release would break the ids Angelo has quoted; the
  other choices move with one migration.

## Confirmation

CLI tests cover 001-US1-AS1 to AS5 and 001-US2-AS2 and AS6; a store test named INV-02 runs the
three refused statements against a migrated temp store.
