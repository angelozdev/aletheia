# Feature Specification: Skeleton

**Feature Branch**: `000-skeleton` | **Created**: 2026-11-08 | **Status**: Draft
**Input**: Slice 0 of `docs/design/2026-11-08-aletheia-design.md` §13: tooling, installed `aletheia` bin, SQLite + migrations, backup. Angelo exercises it with `aletheia --help` and `aletheia backup`.

## Clarifications

### Session 2026-11-08

- Q: Should `prod` back itself up without Angelo asking (daily, or after every write)? → A: No. Backups happen only on `aletheia backup` and before schema changes in `prod`, as in diarium.
- Q: How is the real deck kept safe from half-built code, given the installed `aletheia` runs the repo folder as it is? → A: A development store (`pnpm aletheia` → `data/test.sqlite`) plus Claude Code worktrees: `~/me/aletheia` stays on `main`, and each slice from 1 on is built in a Claude Code worktree.
- Q: Should old backups be removed, or all kept? → A: Keep at most 5 per env; each new copy removes that env's oldest beyond 5, the copy before schema changes included.

## User Scenarios & Testing _(mandatory)_

Slice 0 has no card behavior (constitution V). Its user is Angelo as the system's operator: the commands, paths and checks below are the interface he touches.

### User Story 1 - Run `aletheia` from anywhere (Priority: P1)

The installed `aletheia` works from any directory, says which environment it is using, and never mixes diagnostics into its output, so the global skill of slice 1 can call it from any repo.
**Independent Test**: from a directory outside the repo, run `aletheia --help`, then `pnpm aletheia --help` inside the repo.

1. **000-US1-AS1** Given `aletheia` installed, When Angelo runs `aletheia --help` from a directory outside the repo, Then stdout lists every command and the global options `--env` and `--json`, and it exits 0.
2. **000-US1-AS2** Given any command, When it runs, Then stderr carries `env: <name>` and stdout holds only the command's result.
3. **000-US1-AS3** Given no flag and no variables, When the installed `aletheia` runs from any directory, Then the env is `prod` and the store is `data/prod.sqlite` in the repo; When `pnpm aletheia` runs, Then the env is `test` and the store is `data/test.sqlite`.
4. **000-US1-AS4** Given `--env`, `ALETHEIA_DB` and `ALETHEIA_ENV` set together, When a command runs, Then `--env` wins, then `ALETHEIA_DB`, then `ALETHEIA_ENV`, then the invocation default; with `ALETHEIA_DB` stderr reads `env: custom (<path>)`.
5. **000-US1-AS5** Given an unknown command or option, When it runs, Then it exits 1, stderr names what was not recognized, stdout is empty, and no store is opened.

### User Story 2 - Back up the store (Priority: P1)

`aletheia backup` copies the current env's store to iCloud Drive, so losing the Mac never loses the deck.
**Independent Test**: run `aletheia backup`, open the copy it names, compare with the store.

1. **000-US2-AS1** Given a store, When `aletheia backup` runs, Then a consistent copy lands in `aletheia-backups/` in iCloud Drive under a name carrying the env and the UTC instant, and stdout names the file written and the copies removed (TOON by default, the same fields with `--json`).
2. **000-US2-AS2** Given 5 copies of the same env, When a backup runs, Then that env's oldest copy is removed so the newest 5 remain, and other envs' copies and unrelated files are untouched.
3. **000-US2-AS3** Given the backup cannot be written (iCloud Drive missing or not writable), When `aletheia backup` runs, Then it exits 1 naming the folder, no partial copy is left under a backup name, and the store is unchanged.

### User Story 3 - Schema changes apply themselves safely (Priority: P2)

Every command brings the store to the current schema before running, and in `prod` takes a backup first, so slice 1 and later can change the schema without a manual step.
**Independent Test**: point `ALETHEIA_DB` at a new temp file, run a command, run it again; repeat with a store missing the latest change.

1. **000-US3-AS1** Given no store file, When any command that opens the store runs, Then the store is created and every schema change is applied before the command.
2. **000-US3-AS2** Given a `prod` store with pending schema changes, When any command runs, Then a backup is taken first, stderr reports the backup and each change applied, then the command runs.
3. **000-US3-AS3** Given a store already current, When a command runs, Then no backup is taken and nothing is reported about schema.
4. **000-US3-AS4** Given a pending schema change that fails, When a command runs, Then no pending change is kept, it exits 1 naming the change, and in `prod` the backup taken before it remains.

### User Story 4 - Quality checks guard the conventions (Priority: P3)

The checks the constitution requires run green on a clean checkout and fail on the violations it names, so every later slice inherits them.
**Independent Test**: on a fresh clone, install and run each check; then add each violation below and see the check fail.

1. **000-US4-AS1** Given a clean checkout after install, When the test suite, lint, format check, type check, dead-code check and duplication check run, Then each passes.
2. **000-US4-AS2** Given a `node:*` import under `src/core`, or a code comment anywhere in source, When lint runs, Then it fails naming the file.
3. **000-US4-AS3** Given an acceptance scenario id or invariant id in any `specs/*/spec.md` that no test or eval name contains, When the test suite runs, Then a test fails listing the missing ids.

### Edge Cases

- `ALETHEIA_DB` must be an absolute path; env names use lowercase letters, digits and dashes; `custom` is reserved. Anything else is refused with exit 1 before a store is opened.
- `--help` on the program or on a command opens no store and prints no `env:` line.
- In a non-`prod` env, pending schema changes apply without a backup.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `aletheia` MUST be installable on PATH and resolve the repo's `data/` and schema changes from its own location, not the working directory.
- **FR-002**: Environment resolution MUST follow `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > invocation default (`prod` installed, `test` via `pnpm aletheia`); `--env x` maps to `data/x.sqlite`.
- **FR-003**: Every command MUST print `env: <name>` on stderr; stdout carries results only, TOON by default and JSON with `--json`.
- **FR-004**: Errors MUST exit 1 with a message on stderr and nothing on stdout.
- **FR-005**: Every command that opens the store MUST apply pending schema changes first, all or none; in `prod`, a backup MUST precede them.
- **FR-006**: `aletheia backup` MUST write a consistent copy of a live store, keep the newest 5 per env, and remove nothing else.
- **FR-007**: **INV-01** No test or eval MAY open a store under `data/` or write to iCloud Drive.
- **FR-008**: The repo MUST provide the six checks of 000-US4-AS1, with lint enforcing no `node:*` in `src/core` and no comments, and a test enforcing scenario and invariant traceability.

### Key Entities

- **Environment**: a name and the store it resolves to (`data/<name>.sqlite`, or a custom path).
- **Store**: one database file per environment, recording which schema changes it has applied.
- **Backup copy**: a file in `aletheia-backups/` named by env and instant.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: From a fresh clone, Angelo has a working `aletheia` on PATH with the commands in the quickstart, in under 5 minutes.
- **SC-002**: `aletheia --help` and `aletheia backup` each finish in under 1 second on Angelo's Mac.
- **SC-003**: A backup copy, copied over its env's store, opens as a valid store with the same content.
- **SC-004**: The whole test suite runs in under 5 seconds, and no run touches `data/` or iCloud Drive (INV-01).

## Assumptions

- Slice 0 defines no card tables; slice 1 adds the first domain schema. The plan decides how the schema-change mechanism is exercised before then.
- Restoring is manual: Angelo copies a backup over `data/<env>.sqlite`, with the command given in the quickstart.
- Retention is 5 copies per env (Clarifications); the folder name `aletheia-backups` mirrors diarium.
- No periodic or per-write backup: only `aletheia backup` and the backup before schema changes in `prod` (Clarifications).
- macOS with iCloud Drive only; no fallback location.
- The installed `aletheia` runs `~/me/aletheia` with no build step, installed the way diarium is. That folder stays on `main`; from slice 1 each slice is built in a Claude Code worktree, whose `pnpm aletheia` uses the worktree's own `data/` (FR-001). Slice 0 is built in place: no `prod` data exists yet.
- Out of scope: card commands, `PROFILE.md`, skills, an integrity `check` command, `--version`.
