# Structure and error handling — Design

**Date**: 2026-11-09 · **Status**: draft, awaiting approval · **Branch**: `000-skeleton`

## 1. Intent

Slice 0 is half built (T001–T018) and the code already reads as cluttered. The trigger was
`src/shell/release/release.ts`: `buildAndInstall` does seven things in a row, types sit at the
top of the logic file, refusal messages are strings assembled mid-logic, and `RunResult` is
declared twice (`release.ts` and `tests/support/fake-runner.ts`). Angelo wants this fixed now,
while it is cheap, and wants the fix to be the rule for every later slice, not a one-off
cleanup.

## 2. Goals, non-goals, anti-goals

**Goals**

- Every module lives in its own folder, next to its test and its own `.types.ts`, `.schema.ts`,
  `.errors.ts` and `.constants.ts` files.
- Every failure the code reports is an instance of an error class of its own, never a loose
  string.
- No magic strings or numbers in logic.
- Each type is declared once; everyone else imports it.
- Logic reads as short, named steps.
- The rules are written down (ADR-0007, the tasks' Path Conventions) so T019–T029 follow them.

**Non-goals**

- New lint rules to enforce any of this. Angelo: "no es necesario por ahora". Conventions are
  written and checked in review. (`no-magic-numbers` exists in oxlint 1.89 and was tried; it is
  not turned on.)
- Any change of behavior: CLI output, `pnpm release` output, exit codes and the contract stay
  exactly as they are.

**Anti-goals** (a failure even if it works)

- Types declared inside a logic or test file, or the same shape declared twice.
- Error messages built as strings inside logic.
- A test weakened, skipped or rewritten to pass. Tests move with their modules; their
  assertions do not change.

## 3. Conventions (decided by Angelo)

### 3.1 One folder per module

A module is one `<name>.ts` with what belongs to it, all in a folder named `<name>/`:

```
<name>/
├── <name>.ts             logic only
├── <name>.test.ts        its test
├── <name>.types.ts       every type and interface the module declares
├── <name>.errors.ts      every error class the module throws
├── <name>.constants.ts   every named constant the module uses
└── <name>.schema.ts      every zod or Drizzle schema the module defines
```

Only the files the module needs exist. Schemas are runtime values that types derive from:
`<name>.schema.ts` holds them, and `<name>.types.ts` derives the types
(`z.infer<typeof envNameSchema>`, `typeof cards.$inferSelect`), so neither the logic nor the
constants file holds a schema (Angelo, 2026-11-09, when zod arrives with T022 and Drizzle tables
with slice 1). Angelo approved this exact shape for release:

```
src/shell/release/
├── index.ts
├── release/
│   ├── release.ts           orchestrates only: refusal → build → pack → smoke → install
│   ├── release.test.ts
│   ├── release.types.ts     ReleaseDeps
│   ├── release.errors.ts    NotOnMainError, CheckFailedError, SmokeRunError…
│   └── release.constants.ts
├── runner/
│   ├── runner.ts            the real spawnSync runner
│   └── runner.types.ts      Runner, RunResult (single source; fake-runner imports them)
├── build.ts                 no test, stays loose
└── bin.ts
```

and asked for it across the whole project.

### 3.2 Errors are classes

Typed errors with classes of their own, not loose strings (Angelo). Each failure the contract
names is a class carrying its data (`NotOnMainError` has `branch`, `CheckFailedError` has
`check`).

### 3.3 No magic strings or numbers

Angelo: "Nada de magic strings / numbers". Exit codes `0`/`1`, branch names, folder and file
names, separators and prefixes become named constants in a `.constants.ts`.

## 4. My calls (Angelo may veto)

1. **When a file gets a folder.** A module gets its folder when it has a test or any
   `.types`/`.errors`/`.constants` file. A file that is all of its module (an entry point such
   as `bin.ts`, `released.ts`, `build.ts`) stays loose beside the folders.
2. **A concept with one module is its own folder.** `src/core/backups/backups.ts`, not
   `src/core/backups/backups/backups.ts`. A concept that holds several modules (`cli`,
   `release`, `cli/commands`, `cli/invocation`) has one folder per module inside it.
3. **Barrels stay as ADR-0004 says**, one `index.ts` per unit (`src/core/<concept>`,
   `src/shell/<adapter>`), created only when another unit imports it. Module folders get no
   `index.ts`; inside a unit, relative `.ts` imports point at the module file.
4. **Which literals are magic.** A literal is magic when its meaning is a convention the code
   relies on: it is compared against (`'main'`), repeated (`'dist/aletheia.js'` in build and
   smoke run), or encodes a value with meaning (`0`, `1`, `'.release'`, `'&&'`, `'pnpm '`,
   `'aletheia-release-'`). Not magic: a literal that is its own definition in one place, such
   as commander option declarations and help text, the argv of a command inside the function
   named after it (`currentBranch()` runs `git rev-parse --abbrev-ref HEAD`), and an error's
   message inside its class.
5. **Tests keep the contract's literal text.** Test expectations compare against literal
   strings (`release: refused: on feature, not main`), never against the constants or error
   classes, so a changed message fails a test.
6. **Message text lives in the error class.** The constructor takes the data and builds the
   exact contract message, so the `.errors.ts` file is the only place a message is written.
7. **How errors reach the two edges.** Each module's `.errors.ts` holds the classes that module
   throws, whatever unit it is in (`src/shell/db`, `src/core`, `src/shell/cli`).
   - **CLI edge (`main()`)**: the contract says "exit 1 on any error" with `error: <message>`
     on stderr, so `main()` keeps a catch-all: any thrown error is written as
     `error: <message>` and returns `ExitCode.Failure`. Error classes carry the message without
     the `error: ` prefix (the edge adds it, as the contract defines it per stream). Errors from
     `#shell/db` or `#core/*` therefore need no CLI base class and no translation at the
     boundary. commander's `CommanderError` keeps being handled as today.
   - **Release edge (`release()`)**: a development script with its own contract. It catches
     `ReleaseError` (base in `release.errors.ts`) and writes its message; anything else is a
     bug, rethrown with its stack. Here the class owns its prefix because it varies:
     `ReleaseRefusedError` and its subclasses print `release: refused: <reason>`, the PATH
     mismatch extends `ReleaseError` and prints `release: failed: …`.
   - No base class is shared across units. A unit adds one only when an edge must tell its
     errors apart from others; it then lives in the `.errors.ts` of the module whose edge
     catches it.
8. **Type rule.** Every `type` and `interface` declaration lives in a `.types.ts`. Signatures
   use those names; no inline object-literal types in signatures (`{ cwd?: string }` becomes
   `RunOptions`). Derived type expressions in tests (`ReturnType<typeof f>`) are fine.
9. **`ExitCode`** is `{ Success: 0, Failure: 1 } as const` in `cli/main/main.constants.ts`,
   exported from the `#shell/cli` barrel, used by `main()` and `release()`. `as const` objects,
   because `erasableSyntaxOnly` forbids `enum` (and constructor parameter properties, so error
   classes declare their fields explicitly).
10. **`tests/` follows the same rule.** Cross-cutting tests get folders too
    (`tests/lint/`, `tests/checks/`, `tests/traceability/`). `missingIds` moves next to its
    test in `tests/traceability/`. Helpers without tests stay in `tests/support/`, each in its
    folder when it has types. `tools/lint/no-comments.ts` stays loose (its test is
    `tests/lint/`, which tests the whole `.oxlintrc.json`).
11. **`cli/invocation/` stays** as the grouping the plan and tasks already use, with one folder
    per module inside (`context/`, later `env/`, `output/`, `with-store/`).
12. **`release.ts` keeps its steps as small named functions in the same file.** They are
    tested through `release()` (the public interface), so separate folders for them would be
    folders without tests. `release()` reads as the list of steps.

## 5. Target tree for the code that exists today

```
src/shell/cli/
├── index.ts                     barrel: types Output, Release; ExitCode
├── main/
│   ├── main.ts
│   ├── main.test.ts
│   ├── main.types.ts            CliContext, Output
│   └── main.constants.ts        ExitCode
├── invocation/
│   └── context/
│       ├── context.ts
│       ├── context.test.ts
│       ├── context.types.ts     Release, Vars, Invocation, SourceInvocation, ReleasedInvocation, InvocationContext
│       └── context.constants.ts DEV_VERSION
├── bin/
│   ├── bin.ts                   source entry (package.json script points here)
│   └── bin.test.ts
└── released.ts                  release entry, no test
src/shell/release/
├── index.ts                     barrel: types Runner, RunResult, RunOptions (tests/support imports them)
├── release/                     as in 3.1
├── runner/                      as in 3.1, runner taken out of bin.ts
├── build.ts                     uses the bundle path constant shared with the smoke run
└── bin.ts                       wiring only
tests/
├── checks/checks.test.ts
├── lint/{lint.test.ts, lint.types.ts}
├── traceability/{traceability.ts, traceability.test.ts, traceability.constants.ts}
└── support/
    ├── streams/{streams.ts, streams.types.ts}
    └── fake-runner/{fake-runner.ts, fake-runner.types.ts}   RunCall; Runner/RunResult from #shell/release
tools/lint/no-comments.ts
```

Paths that move ripple into `package.json` (`aletheia` script), the repo-root computations
(`join(import.meta.dirname, '..', …)` in `cli/bin/bin.ts`, `tests/lint/lint.test.ts`,
`tests/checks/checks.test.ts`), and relative imports. `knip.json` (entry `released.ts`) and
`build.ts`'s input path do not move.

## 6. Documents to update

- **ADR-0007** "One folder per module, with types, errors and constants files", `accepted` on
  Angelo's approval of this design; extends ADR-0004 (does not supersede it). Index row in
  `docs/adr/README.md`.
- **`specs/000-skeleton/plan.md`**: the Project Structure tree.
- **`specs/000-skeleton/tasks.md`**: Path Conventions gets the rules of §3–§4; every path in
  pending tasks T019–T029 is rewritten to the new layout (e.g. `src/shell/cli/commands/backup.ts`
  → `src/shell/cli/commands/backup/backup.ts`, `src/shell/db/backups/backup.ts` →
  `src/shell/db/backups/backups.ts`, `tests/support/traceability.ts` →
  `tests/traceability/traceability.ts`); a line states that every failure a task names by its
  message is an error class in the module's `.errors.ts`. Done tasks T001–T018 keep their text
  (they record what was done), with one note pointing at this design.

## 7. Constraints

- Pure refactor (named exception to vertical slicing): no behavior change, no new feature.
- The six checks (`pnpm check`) green after every step; commit after each green step on
  `000-skeleton`, never push.
- Test files move with their modules; their assertions are unchanged.
- No comments in code (ADR-0006); kebab-case file names (dotted names such as
  `release.types.ts` pass `unicorn/filename-case`, tried).
- No new dependencies.

## 8. Left to the builder

- Exact constant names and which constants file each one lives in, inside the rules above.
- How the steps of `release.ts` are cut, as long as each is a short named function and
  `release()` reads as the list.
- The order of the refactor steps.
