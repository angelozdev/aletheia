# 0010. The store is opaque outside the db adapter

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0002](0002-drizzle-over-node-sqlite-migrations-applied-at-startup.md),
  [0006](0006-oxlint-with-local-rules-oxfmt-knip-jscpd.md)

## Context and problem statement

ADR-0002 and ADR-0006 keep `node:sqlite` and `drizzle-orm` imports inside `src/shell/db`, and
lint enforces it. The ORM still leaks through types: `#shell/db` exports `Store` as Drizzle's
`NodeSQLiteDatabase & { $client: DatabaseSync }`, so any caller can reach Drizzle's API and
`$client`, and the CLI tests already run raw SQL through `store.$client`. Angelo wants Drizzle
encapsulated in one place. How do the store's callers, production and tests, stay unaware of
the ORM?

## Decision drivers

- Nothing outside `src/shell/db` can call Drizzle or `node:sqlite`, by import or by type
  (Constitution III: nothing outside an adapter knows the engine or the ORM).
- Swapping the ORM changes `src/shell/db` and nothing else.
- Tests still arrange store files and inspect copies with SQL, through the public interface.
- No new dependency or tool.

## Considered options

1. Imports confined by lint, the Drizzle type exported as `Store` (status quo)
2. An opaque `Store` outside `src/shell/db`, with SQL test helpers in `tests/support/store/`
3. Option 2, and only `src/shell/db/drizzle/` imports `drizzle-orm`

## Decision outcome

Chosen option: **2**.

- `#shell/db` exports `Store` as an opaque branded type. Drizzle's type stays inside the unit
  as `Database`; `openStore` returns a `Store`, and the unit's functions unwrap it in one place.
- `tests/support/store/` gains helpers that open a store file with `node:sqlite` to run and
  read SQL by path. `.oxlintrc.json` lets that folder import `node:sqlite`, never
  `drizzle-orm`; Constitution III governs the code that ships, and these helpers never ship.
- Every other rule of ADR-0002 and ADR-0006 stands.

### Pros and cons of the options

**Status quo**
- Good, because no change.
- Bad, because `$client` and Drizzle's query API are one property away from every caller.

**Opaque store**
- Good, because `tsc` rejects any use of the store outside `src/shell/db` beyond passing it on.
- Bad, because one lint exception for test support, and an unwrap cast inside the unit.

**Opaque store and a drizzle/ folder**
- Good, because the ORM sits in a single folder.
- Bad, because from slice 1 every repository's queries (`sqliteTable`, `eq`) would route
  through that folder, for no gain over the unit boundary.

## Consequences

- Good: Drizzle's surface is the db unit; callers see `openStore`, `closeStore`,
  `backupStore` and an opaque `Store`.
- Bad / cost: tests that inspect a store open a second connection on its file.

## Confirmation

`tsc` fails on `store.$client` outside `src/shell/db`; `tests/lint/lint.test.ts` covers the
`tests/support/store/` exception (it may import `node:sqlite`, not `drizzle-orm`).
