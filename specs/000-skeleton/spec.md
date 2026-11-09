# Feature Specification: Skeleton

**Feature Branch**: `000-skeleton` | **Created**: 2026-11-08 | **Status**: Draft
**Input**: Slice 0 of `docs/design/2026-11-08-aletheia-design.md` §13: tooling, installed `aletheia` bin, SQLite + migrations, backup. Angelo exercises it with `aletheia --help` and `aletheia backup`.

## Clarifications

### Session 2026-11-08

- Q: Should `prod` back itself up without Angelo asking (daily, or after every write)? → A: No. Backups happen only on `aletheia backup` and before schema changes in `prod`, as in diarium.
- Q: How is the real deck kept safe from half-built code, given the installed `aletheia` could run the repo folder as it is? → A: Release it like an npm package: `pnpm release` builds `main`, packs it and installs the package globally. The installed `aletheia` runs only released code; the repo is for development, through `pnpm aletheia` on `data/test.sqlite`. No worktrees.
- Q: Should old backups be removed, or all kept? → A: Keep at most 5 per env; each new copy removes that env's oldest beyond 5, the copy before schema changes included.

## User Scenarios & Testing _(mandatory)_

Slice 0 has no card behavior (constitution V). Its user is Angelo as the system's operator: the commands, paths and checks below are the interface he touches.

### User Story 1 - Run `aletheia` from anywhere (Priority: P1)

The installed `aletheia` works from any directory, says which environment it is using, and never mixes diagnostics into its output, so the global skill of slice 1 can call it from any repo.
**Independent Test**: from a directory outside the repo, run `aletheia --help`, then `pnpm aletheia --help` inside the repo.

1. **000-US1-AS1** Given `aletheia` installed, When Angelo runs `aletheia --help` from a directory outside the repo, Then stdout lists every command and the global options `--env` and `--json`, and it exits 0.
2. **000-US1-AS2** Given any command, When it runs, Then stderr carries `env: <name>` and stdout holds only the command's result.
3. **000-US1-AS3** Given no flag and no variables, When the installed `aletheia` runs from any directory, Then the env is `prod` and the store is `~/.aletheia/prod.sqlite`, outside the repo; When `pnpm aletheia` runs, Then the env is `test` and the store is `data/test.sqlite`.
4. **000-US1-AS4** Given `--env`, `ALETHEIA_DB` and `ALETHEIA_ENV` set together, When a command runs, Then `--env` wins, then `ALETHEIA_DB`, then `ALETHEIA_ENV`, then the invocation default; with `ALETHEIA_DB` stderr reads `env: custom (<path>)`.
5. **000-US1-AS5** Given an unknown command or option, When it runs, Then it exits 1, stderr names what was not recognized, stdout is empty, and no store is opened.

### User Story 2 - Release what is ready (Priority: P1)

`pnpm release` turns `main` into an installed package, as if it were published to npm, so the deck only ever runs released code and the repo stays free for development.
**Independent Test**: release, edit a command's help text without committing, compare `aletheia --help` with `pnpm aletheia --help`.

1. **000-US2-AS1** Given a clean `main` with every check green, When Angelo runs `pnpm release`, Then the CLI is built, packed and installed globally in place of the previous release, and `aletheia --version` prints the version and the commit released.
2. **000-US2-AS2** Given a branch other than `main`, uncommitted changes or a failing check, When `pnpm release` runs, Then it refuses naming the reason, and the installed `aletheia` is unchanged.
3. **000-US2-AS3** Given a release and later edits in the repo, When the installed `aletheia` runs, Then it behaves as the release; only `pnpm aletheia` shows the edits, and its `--version` says `dev`.

### User Story 3 - Back up the store (Priority: P1)

`aletheia backup` copies the current env's store into `backups/` in its entry's data folder, so a bad schema change or a damaged store never loses the deck. Nothing leaves the Mac.
**Independent Test**: run `aletheia backup`, open the copy it names, compare with the store.

1. **000-US3-AS1** Given a store, When `aletheia backup` runs, Then a consistent copy lands in `backups/` in the entry's data folder, created when missing, under a name carrying the env and the UTC instant, and stdout names the file written and the copies removed (TOON by default, the same fields with `--json`).
2. **000-US3-AS2** Given 5 copies of the same env, When a backup runs, Then that env's oldest copy is removed so the newest 5 remain, and other envs' copies and unrelated files are untouched.
3. **000-US3-AS3** Given the backup cannot be written (its folder cannot be created or is not writable), When `aletheia backup` runs, Then it exits 1 naming the folder, no partial copy is left under a backup name, and the store is unchanged.

### User Story 4 - Schema changes apply themselves safely (Priority: P2)

Every command brings the store to the current schema before running, and in `prod` takes a backup first, so slice 1 and later can change the schema without a manual step.
**Independent Test**: point `ALETHEIA_DB` at a new temp file, run a command, run it again; repeat with a store missing the latest change.

1. **000-US4-AS1** Given no store file, When any command that opens the store runs, Then the store is created and every schema change is applied before the command.
2. **000-US4-AS2** Given a `prod` store with pending schema changes, When any command runs, Then a backup is taken first, stderr reports the backup and each change applied, then the command runs.
3. **000-US4-AS3** Given a store already current, When a command runs, Then no backup is taken and nothing is reported about schema.
4. **000-US4-AS4** Given a pending schema change that fails, When a command runs, Then no pending change is kept, it exits 1 naming the change, and in `prod` the backup taken before it remains.
5. **000-US4-AS5** Given a store holding schema changes this code does not know (an older release run on a newer store), When a command runs, Then it exits 1 naming them, and the store is unchanged.

### User Story 5 - Quality checks guard the conventions (Priority: P3)

The checks the constitution requires run green on a clean checkout and fail on the violations it names, so every later slice inherits them.
**Independent Test**: on a fresh clone, install and run each check; then add each violation below and see the check fail.

1. **000-US5-AS1** Given a clean checkout after install, When the test suite, lint, format check, type check, dead-code check and duplication check run, Then each passes.
2. **000-US5-AS2** Given a `node:*` import under `src/core`, or a code comment anywhere in source, When lint runs, Then it fails naming the file.
3. **000-US5-AS3** Given an acceptance scenario id or invariant id in any `specs/*/spec.md` that no test or eval name contains, When the test suite runs, Then a test fails listing the missing ids.

### Edge Cases

- `ALETHEIA_DB` must be an absolute path; env names use lowercase letters, digits and dashes; `custom` is reserved. Anything else is refused with exit 1 before a store is opened.
- `--help` and `--version`, on the program or on a command, open no store and print no `env:` line.
- In a non-`prod` env, pending schema changes apply without a backup.
- `pnpm release` never opens a store: a release's schema changes apply, after a backup, on the next `prod` command.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The installed `aletheia` MUST run from its own installed copy, independent of the repo's files, and keep its stores in `~/.aletheia/`, outside the repo; `pnpm aletheia` MUST run the repo's current code with the repo's `data/`.
- **FR-002**: Environment resolution MUST follow `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > invocation default (`prod` installed, `test` via `pnpm aletheia`); `--env x` maps to `data/x.sqlite`.
- **FR-003**: Every command MUST print `env: <name>` on stderr; stdout carries results only, TOON by default and JSON with `--json`.
- **FR-004**: Errors MUST exit 1 with a message on stderr and nothing on stdout.
- **FR-005**: Every command that opens the store MUST apply pending schema changes first, all or none; in `prod`, a backup MUST precede them.
- **FR-006**: `aletheia backup` MUST write a consistent copy of a live store, keep the newest 5 per env, and remove nothing else.
- **FR-007**: **INV-01** No test or eval MAY open a store or write a backup under `data/` or `~/.aletheia/`, or change the installed `aletheia`.
- **FR-008**: The repo MUST provide the six checks of 000-US5-AS1, with lint enforcing no `node:*` in `src/core` and no comments, and a test enforcing scenario and invariant traceability.
- **FR-009**: `pnpm release` MUST build, pack and install only from a clean `main` with the six checks green, and the package MUST carry everything the CLI needs at runtime, schema changes included.

### Key Entities

- **Environment**: a name and the store it resolves to (`<name>.sqlite` in the entry's data folder, `~/.aletheia/` installed or the repo's `data/` from the sources, or a custom path).
- **Store**: one database file per environment, recording which schema changes it has applied.
- **Backup copy**: a file in `backups/` in the entry's data folder, named by env and instant.
- **Release**: the installed package, identified by its version and the commit it was built from.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: From a fresh clone, Angelo has a released `aletheia` on PATH with the commands in the quickstart, in under 5 minutes.
- **SC-002**: `aletheia --help` and `aletheia backup` each finish in under 1 second on Angelo's Mac.
- **SC-003**: A backup copy, copied over its env's store, opens as a valid store with the same content.
- **SC-004**: The whole test suite runs in under 5 seconds, and no run touches `data/`, `~/.aletheia/` or the installed `aletheia` (INV-01).
- **SC-005**: A release from a clean `main` is one command and takes under 1 minute.

## Assumptions

- Slice 0 defines no card tables; slice 1 adds the first domain schema. The plan decides how the schema-change mechanism is exercised before then.
- Restoring is manual: Angelo copies a backup over the env's store (`~/.aletheia/prod.sqlite` for `prod`), with the command given in the quickstart.
- Retention is 5 copies per env (Clarifications).
- No periodic or per-write backup: only `aletheia backup` and the backup before schema changes in `prod` (Clarifications).
- macOS only. Nothing is written to iCloud Drive or leaves the Mac, so losing the Mac or its disk loses the deck with its copies; an off-machine copy is Time Machine's job, which covers `~/.aletheia/` by default.
- Development happens in `~/me/aletheia` on feature branches. Angelo runs `pnpm release` himself after merging to `main`; Claude gives him the command. The version number changes by hand when Angelo wants; the commit in `--version` is what tells releases apart.
- The package is packed and installed locally, never published to the npm registry. How it is built is left to the plan.
- Out of scope: card commands, `PROFILE.md`, skills, an integrity `check` command.
