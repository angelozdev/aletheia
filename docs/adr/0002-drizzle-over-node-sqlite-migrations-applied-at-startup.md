# 0002. Drizzle ORM over node:sqlite, migrations applied at startup

- **Status:** proposed
- **Date:** 2026-11-08
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

The design fixes SQLite through `node:sqlite` with Drizzle's `node-sqlite` driver, and the
constitution says the schema lives in TypeScript and `drizzle-kit generate` derives numbered
SQL migrations applied at startup. Slice 0 has no tables yet. How are migrations applied, when
is the backup taken, and what happens when the store and the code disagree?

## Decision drivers

- All or none: a failed migration leaves the store as it was (000-US4-AS4).
- `prod` is backed up before any migration (constitution, 000-US4-AS2).
- An older release must not write to a newer store (000-US4-AS5).
- No tables in slice 0: the mechanism is proven without inventing a schema (Constitution VI).

## Considered options

1. Drizzle's `migrate()` from `drizzle-orm/node-sqlite/migrator`, wrapped by a read-only
   pending check
2. Hand-written runner over `node:sqlite`
3. Ship a placeholder migration in slice 0

## Decision outcome

Chosen option: **1**. Migrations live in `migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql`,
the drizzle-kit 1.0 layout. Before migrating, the shell reads `__drizzle_migrations` read-only:
names the code does not know refuse the command (exit 1, nothing applied); otherwise the
pending names decide whether `prod` takes a backup first. `migrate()` then runs every pending
migration in one `BEGIN … COMMIT`, rolling back on failure (verified in `drizzle-orm`
1.0.0-rc source). `migrations/` ships empty in slice 0 (a `.gitkeep`); tests use fixture
folders. `drizzle-kit`, `drizzle.config.ts` and `src/shell/db/schema.ts` arrive with slice 1's
first table. Only `src/shell/db` imports `node:sqlite` and `drizzle-orm` (lint).

### Pros and cons of the options

**Drizzle's migrator**
- Good, because the transaction and the bookkeeping table are already tested upstream.
- Bad, because a release candidate (1.0.0-rc) of Drizzle, as in diarium.

**Hand-written runner**
- Bad, because rebuilding what the ORM already ships (Constitution VI).

**Placeholder migration**
- Bad, because a table with no user story.

## Consequences

- Good: slice 1 only runs `pnpm db:generate` and commits the folder.
- Bad / cost: the mechanism is exercised by fixtures until slice 1 ships a real migration.

## Confirmation

`src/shell/db/migrations` tests over fixture folders cover 000-US4-AS1 to AS5; lint forbids
`node:sqlite` and `drizzle-orm` outside `src/shell/db`.
