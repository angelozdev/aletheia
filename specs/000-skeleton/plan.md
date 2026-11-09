# Implementation Plan: Skeleton

**Branch**: `000-skeleton` | **Date**: 2026-11-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/000-skeleton/spec.md`

## Summary

A Node 26 TypeScript CLI, `aletheia`, with `--help`, `--version` and `backup`; one SQLite store
per environment that applies Drizzle migrations at startup (backup first in `prod`, all or
none, unknown migrations refused); a `pnpm release` that builds `main` with Rolldown, packs it
and installs the tarball globally; and the six checks the constitution requires, with local
oxlint rules for comments and boundaries and a traceability test. Decisions in
[research.md](./research.md) and ADRs [0001](../../docs/adr/0001-data-inside-the-repo-environment-by-invocation.md)–[0006](../../docs/adr/0006-oxlint-with-local-rules-oxfmt-knip-jscpd.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (`tsc --noEmit`), Node 26 with native type stripping
for development and tests; the release is a Rolldown 1.2.15 bundle (R5)

**Primary Dependencies**: commander 15.0.0 + @commander-js/extra-typings 15.0.0, zod 4.6.7,
drizzle-orm 1.0.0-rc.5 (`node-sqlite`), @toon-format/toon 4.4.0 — all bundled, so
`devDependencies` (R2)

**Storage**: `node:sqlite` files `data/<env>.sqlite`; backups in iCloud Drive
`aletheia-backups/` (data-model.md)

**Testing**: vitest 5.0.5; `:memory:` and temp stores; CLI through `main()`; one spawn test of
the source bin; release steps through a fake command runner (R4, R7, R12)

**Target Platform**: macOS with iCloud Drive, Node 26, pnpm 11.28.8

**Project Type**: CLI, one package

**Performance Goals**: `aletheia --help` and `aletheia backup` under 1 s (SC-002); test suite
under 5 s (SC-004); release under 1 min (SC-005)

**Constraints**: no network in the CLI; `src/core` without `node:*`; only `src/shell/db` imports
`node:sqlite` and `drizzle-orm`; stdout holds results only; no test reaches `data/`, iCloud
Drive or the installed `aletheia` (INV-01)

**Scale/Scope**: one user, one Mac; three commands; zero domain tables

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.1.0, amended to 1.2.0 by this
plan (R13)._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Slice 0 is the named exception; it ends in `aletheia --help` and `aletheia backup` installed. |
| II. Facts in code, judgment in Claude | Pass. No judgment in slice 0; backup naming and retention are pure core functions. |
| III. Pure core, single writer, nothing deleted | Pass. `src/core/backups` is pure; lint enforces the boundaries; the CLI is the only writer. Removing backup copies beyond 5 deletes backup files, never cards. |
| IV. Test-driven, spec-anchored | Pass. Every AS and INV-01 has a test named by its id, enforced by `tests/traceability.test.ts`. Scripts (release, lint rule) are test-first too. |
| V. Small slices, one-page specs | Pass (amended 1.1.0). Spec is about one page. |
| VI. Simplicity and YAGNI | Pass with amendment. `drizzle-kit` deferred to slice 1. New tools beyond the design: `rolldown` (release, ADR-0005), `@oxlint/plugins` and `eslint-plugin-sonarjs` (lint, ADR-0006). The bundle is a build, never committed, so not a generator (amended wording). |
| VII. English system, Spanish content | Pass. No card content in slice 0. |
| VIII. Conversation, not commands | Pass. No skill yet; `pnpm release` is a development step Claude hands to Angelo. |
| IX. Quality over volume | N/A in slice 0. |
| Technology Constraints | Pass with amendment: "native type stripping" now covers development and tests; the release is a bundle installed outside the repo; the sources default to `test`. |
| ADRs | 0001–0006 `proposed`; Angelo accepts them before `/speckit-implement`. |

Re-check after Phase 1: unchanged; the data model adds no table and the contract adds no
command beyond the spec.

## Project Structure

### Documentation (this feature)

```text
specs/000-skeleton/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── core/
│   └── backups/                 backups.ts (file name, copies to remove), its test, index.ts
└── shell/
    ├── cli/
    │   ├── index.ts             barrel
    │   ├── main/                main(argv, context) → exit code; commander program; CliContext, ExitCode
    │   ├── bin/                 source entry: default env test, REPO_ROOT
    │   ├── released.ts          release entry: default env prod, __ALETHEIA_RELEASE__
    │   ├── invocation/          context/, env/ (resolution, zod), output/ (TOON/JSON, stderr lines), with-store/
    │   └── commands/            backup/
    ├── db/
    │   ├── index.ts
    │   ├── database/            open/close over node:sqlite + drizzle
    │   ├── migrations/          migrations.ts (pending, unknown, apply)
    │   └── backups/             backups.ts (online backup, rename, prune)
    └── release/
        ├── index.ts             barrel: runner types
        ├── bin/                 pnpm release entry
        ├── release/             the steps, their typed errors and constants
        ├── runner/              spawnSync runner, Runner types
        └── build/               rolldown API call
migrations/.gitkeep
tools/lint/no-comments.ts        local oxlint JS plugin
tests/
├── checks/  lint/  traceability/
└── support/                     streams/, fake-runner/, fixture-migrations/
.oxlintrc.json  .oxfmtrc.json  knip.json  .jscpd.json  tsconfig.json  vitest.config.ts
package.json  pnpm-workspace.yaml  .gitignore (data/, dist/, .release/, node_modules/)
CLAUDE.md
```

Each module is a folder holding `<name>.ts`, its `<name>.test.ts` and, as needed, its
`.types.ts`, `.errors.ts`, `.constants.ts` and `.schema.ts`; an entry point without any of them
stays a loose file ([ADR-0007](../../docs/adr/0007-one-folder-per-module-with-types-errors-and-constants.md)).
Cross-cutting tests get folders in `tests/`.

**Structure Decision**: one package, functional core and imperative shell in concept folders
reached through `#core/*` and `#shell/*` (ADR-0004).

## Delivery order (vertical slices for `/speckit-tasks`)

Each ends in something Angelo runs. Thinnest first.

1. **Checks and `pnpm aletheia --help`** (shared setup exception, plus US5 and the source half
   of US1-AS1 and US2-AS3): package, tooling, the six checks, the traceability test, the lint
   rules, and a `main()` with help and `--version` → `dev`. Run: `pnpm check`,
   `pnpm aletheia --help`.
2. **Release** (US2, US1-AS1): `pnpm release` from `main`, refusals, smoke run, global install.
   Run: merge, `pnpm release`, `aletheia --help` from another directory, `aletheia --version`.
3. **Environments and backup** (US1-AS2…AS5, US3, INV-01): env resolution, store opening, the
   `env:` line, `aletheia backup` with retention 5. Run: `pnpm aletheia backup`, then
   `aletheia backup` after a release.
4. **Migrations at startup** (US4): pending, unknown, all or none, backup first in `prod`.
   Exception: exercised by fixture migrations until slice 1; Angelo sees it through the tests
   named `000-US4-*`.
5. **Close** : `CLAUDE.md`, ADRs accepted, release to `prod`, quickstart walked.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| A build step for the release (constitution named only type stripping) | Angelo asked to mark what is released apart from development (spec Clarifications) | Copying the sources does not give a build; running the working tree lets half-built code reach `prod` |
| Two oxlint JS plugins (alpha) | No built-in rule forbids comments or measures cognitive complexity | eslint is not the design's linter; dropping the rules loses what diarium enforces |
