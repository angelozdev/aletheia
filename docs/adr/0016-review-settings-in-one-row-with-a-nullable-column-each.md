# 0016. Review settings in one row, with a nullable column each

- **Status:** proposed
- **Date:** 2026-11-10
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0013](0013-cards-tags-and-reviews-with-rules-in-the-store.md)

## Context and problem statement

Angelo keeps three lasting defaults for his reviews: session size, new cards per day and new
share (spec 003, US4). They live in the store, so they are backed up with the deck, each
environment keeps its own, and the CLI stays the only writer (spec Clarifications). `settings
show` must say which ones are still at the built-in default. What shape does the store give
them?

## Decision drivers

- Each value is refused out of range at write time, by `CHECK` where SQL can say it
  (constitution III).
- "Still at the built-in default" is visible without comparing values.
- Drizzle declares it; no custom SQL.
- One set per store, one person (spec Assumptions).

## Considered options

1. One row, `id` fixed at 1, a nullable integer column per setting
2. Key/value rows, `(name primary key, value)`
3. One JSON column

## Decision outcome

Chosen option: **1**. Table `settings(id integer primary key CHECK (id = 1), session_size
integer CHECK (session_size IS NULL OR session_size >= 1), new_per_day integer CHECK (... >= 0),
new_share integer CHECK (... BETWEEN 0 AND 100))`, from a generated migration. `null` is the
built-in default; `settings set --x default` writes `null`, and a missing row reads as all
`null`. The built-in values and their layering (one-session flag > setting > built-in) live in
`src/core/settings`, behind a `SettingsRepository` port.

### Pros and cons of the options

**One row, a column each**
- Good, because each setting has its own type and its own plain `CHECK`.
- Good, because `null` stores "not chosen", so a default that changes in a later release
  still applies.
- Bad, because a new setting needs a migration that adds a column.

**Key/value rows**
- Good, because a new setting needs no migration.
- Bad, because every value shares one loose type, and the range checks sit in one `CASE` on
  the name.

**One JSON column**
- Bad, because the range checks go through `json_extract` in hand-written SQL, and Drizzle sees
  only text.

## Consequences

- Good: an out-of-range value is refused by the store as well as by the CLI. `settings show`
  reads "default" straight from `null`.
- Bad / cost: one migration per new setting, which `pnpm db:generate` writes.

## Confirmation

CLI tests of 003-US4-AS1 to AS3 over temp stores; the store refusing a second row and each
out-of-range value, seen failing through `tests/support/store`.
