# Aletheia

A spaced-repetition deck Angelo studies every day: the `aletheia` CLI (TypeScript, Node 26,
`node:sqlite` through Drizzle) holds the facts, Claude skills hold the judgment. The
[constitution](.specify/memory/constitution.md) governs this repo and overrides this file.
Decisions and their reasons are in [`docs/adr/`](docs/adr/); the approved design is in
[`docs/design/`](docs/design/2026-11-08-aletheia-design.md).

Talk to Angelo in Spanish. Code, identifiers, tests, commits, specs and docs are in English.

## Commands

- `pnpm aletheia <command>` runs the sources against `data/test.sqlite` (`ALETHEIA_ENV=test`).
  Develop and try changes with it, never with the installed `aletheia`: that is the release,
  and it defaults to `prod` in `~/.aletheia/`. Aletheia's own skills (review, stats,
  prune) are the exception: they call the installed `aletheia`, because that is use, not
  development.
- `pnpm test` runs vitest. `pnpm check` runs test, lint, format:check, typecheck, dead-code
  and duplication; it passes before a task is closed. `pnpm format` fixes formatting.
- `pnpm release` is Angelo's: he runs it from a clean `main` after a merge. Give him the
  command, never run it.

## Workflow

- Spec Kit: `specs/NNN-<slice>/spec.md` says what, `tasks.md` says in which order. Work one
  task at a time, test first: failing test, minimal code, refactor.
- Every test or eval that covers an acceptance scenario or an invariant carries its id
  (`NNN-USx-ASy`, `INV-nn`) in its name. `tests/traceability/` fails while a spec id has none.
- A test that looks wrong is raised with Angelo, never weakened, skipped or deleted.
- Conventional Commits, small, on feature branches only, never on `main`. No push.
- Destructive operations (deleting data, resetting a repo, uninstalling) are handed to Angelo
  as commands to run.

## Code

- No comments: names and extracted functions explain the code (lint rule `local/no-comments`).
- `src/core` is pure: no `node:*`, no I/O, no clock; time and persistence are injected.
- Only `src/shell/db` imports `node:sqlite` and `drizzle-orm`; everywhere else the `Store` is
  opaque (ADR-0010). `tests/support/store/` may use `node:sqlite` to arrange and inspect store
  files, never `drizzle-orm`.
- Units import each other through their barrels, `#core/<concept>` and `#shell/<adapter>`
  (one `index.ts` per unit); inside a unit, relative `.ts` imports (ADR-0004).
- One folder per module: `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`, `<name>.errors.ts`,
  `<name>.constants.ts`, `<name>.schema.ts`, each only when needed. Every type lives in a
  `.types.ts`, every failure is an error class, conventional literals are named constants
  (ADR-0007). File names are kebab-case.
- `zod` validates input at the CLI edge; output is TOON by default, JSON with `--json`.

## Data

- The CLI is the only writer. Never open or edit a store directly.
- Environment: `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > default by invocation. Every command
  prints `env: <name>` on stderr.
- INV-01: no test or eval opens a store or writes a backup under `data/` or `~/.aletheia/`,
  or changes the installed `aletheia`. Tests inject a temp data folder or `ALETHEIA_DB`.
