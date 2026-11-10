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
- The CLI's commands: `backup`; `card add`, `card search` and `review grade`, which read JSON
  on stdin (a quoted heredoc, `<<'JSON'`); `card show <id>` and `review due`. `--help` on any
  of them gives its usage; `specs/001-capture-and-review/contracts/cli.md` and
  `specs/002-intake-filter/contracts/cli.md` give their output and errors.
- `pnpm db:generate --name <name>` derives a migration from the `*.schema.ts` files;
  `pnpm exec drizzle-kit generate --custom --name <name>` makes an empty one for triggers.
  Read the SQL before committing it.
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
- Skills: `az-aletheia-add` (global) lives in `skills/az-aletheia-add/` and reaches Claude only
  through a release, which copies it to `~/.aletheia/skills/`; editing it here changes nothing
  until the next `pnpm release`. `aletheia-review` (local) lives in
  `.claude/skills/aletheia-review/`. Both call the installed `aletheia`, never `pnpm aletheia`.

## Code

- No comments: names and extracted functions explain the code (lint rule `local/no-comments`).
- No call takes a call that takes a call: name the inner result in a `const`
  (`local/no-nested-calls`). `await` counts with the call it waits on; callbacks start over.
- `src/core` is pure: no `node:*`, no I/O, no clock; time and persistence are injected.
- Only `src/shell/db` imports `node:sqlite` and `drizzle-orm`; everywhere else the `Store` is
  opaque (ADR-0010). A repository is a port `interface` owned by `src/core` and a class in
  `src/shell/db` that implements it over a `Store` (`StoreCardRepository implements
  CardRepository`), one per store opened. `tests/support/store/` may use `node:sqlite` to
  arrange and inspect store files, never `drizzle-orm`.
- Only `src/core/time` imports `date-fns` and `@date-fns/tz`; only `src/core/scheduling`
  imports `ts-fsrs` (lint). Instants are stored in UTC (`2026-11-09T15:00:00.000Z`) and shown
  in the local time of whoever runs the CLI, with the offset; "today" is the local day.
- Units import each other through their barrels, `#core/<concept>` and `#shell/<adapter>`
  (one `index.ts` per unit); inside a unit, relative `.ts` imports (ADR-0004).
- One folder per module: `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`, `<name>.errors.ts`,
  `<name>.constants.ts`, `<name>.schema.ts`, each only when needed. Every type lives in a
  `.types.ts`, every failure is an error class, conventional literals are named constants
  (ADR-0007). File names are kebab-case.
- `zod` validates input at the CLI edge; output is TOON by default, JSON with `--json`.
- Tags are English, lowercase `a`–`z`, digits and dashes, in segments joined by `::`
  (`messaging::redis-streams`); card content is Spanish.

## Data

- The CLI is the only writer. Never open or edit a store directly.
- `PROFILE.md` at the repo root is Angelo's and ignored by git (ADR-0015). The skills read it
  and edit it only after he approves the exact line; no test or eval reads or writes it.
- Environment: `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > default by invocation. Every command
  prints `env: <name>` on stderr.
- INV-01: no test or eval opens a store or writes a backup under `data/` or `~/.aletheia/`,
  or changes the installed `aletheia`. Tests inject a temp data folder or `ALETHEIA_DB`.
