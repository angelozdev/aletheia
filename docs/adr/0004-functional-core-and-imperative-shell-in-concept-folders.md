# 0004. Functional core and imperative shell in concept folders

- **Status:** proposed
- **Date:** 2026-11-08
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

Constitution III requires a pure `src/core` and adapters in `src/shell`. Diarium started with
flat layers and had to migrate to concept folders with barrels (its ADR-0044) once files piled
up. Aletheia starts empty. Which layout from day one?

## Decision drivers

- A path says which concept a file belongs to and which side of the boundary it is on.
- Reaching past a barrel fails structurally, not by review.
- Development, tests and the release build read the same import form.

## Considered options

1. Flat layers `src/core`, `src/db`, `src/cli`
2. Concept folders with Node subpath imports `#core/*`, `#shell/*`, `#tests/*` (diarium today)

## Decision outcome

Chosen option: **2**. `src/core/<concept>/` holds pure logic with an `index.ts` barrel;
`src/shell/<adapter>/<concept>/` holds I/O (`db`, `cli`, `release`). `package.json` `imports`
maps `#core/*` to `./src/core/*/index.ts` and `#shell/*` to `./src/shell/*/index.ts`; inside a
unit, relative `.ts` imports. In slice 0 the core holds one concept, `backups` (file names and
which copies to keep).

### Pros and cons of the options

**Flat layers**
- Bad, because the refactor diarium needed later.

**Concept folders**
- Good, because the boundary is in the path from the first file.
- Bad, because more folders than slice 0 strictly needs.

## Consequences

- Good: slice 1 adds `src/core/cards/` without moving anything.
- Bad / cost: the bundler must resolve `package.json` `imports` (checked in research).

## Confirmation

Lint forbids `node:*` under `src/core/**`; knip reports unused barrel exports.
