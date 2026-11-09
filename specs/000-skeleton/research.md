# Research: Skeleton

Versions are the newest stable releases published before 2026-10-25 (two weeks before the
plan), checked with `npm view <pkg> time`. Tooling facts were tried in a scratch project on
Node 26.13.0 without touching the real global install.

## R1. Runtime and package

- **Decision**: Node 26 (`engines: 26.x`), ESM, one package, `pnpm@11.28.8` pinned in
  `packageManager`; `pnpm-workspace.yaml` holds `saveExact: true` and `allowBuilds` only
  (diarium ADR-0043). TypeScript `7.0.2` for `tsc --noEmit` with `erasableSyntaxOnly`,
  `allowImportingTsExtensions`, `rewriteRelativeImportExtensions` off, `noEmit`. `@types/node`
  `26.6.5`.
- **Rationale**: development and tests run the sources through Node's type stripping, as in
  diarium. pnpm 11 gives each global package an isolated folder (R6). TypeScript 7 is the
  current stable line.
- **Alternatives**: pnpm 10 (global manifest keeps the tarball path, R6); pnpm 12 (no project
  on this machine uses it yet); TypeScript 6.0.3 (diarium's; fallback if a tool rejects 7).

## R2. Runtime libraries

- **Decision**: `commander` `15.0.0` + `@commander-js/extra-typings` `15.0.0`, `zod` `4.6.7`,
  `drizzle-orm` `1.0.0-rc.5`, `@toon-format/toon` `4.4.0`. All are bundled into the release
  (R5), so they are `devDependencies`; the packed package has no runtime dependencies.
- **Rationale**: the design's stack. `drizzle-orm` stable (`0.45.4`) has no `node-sqlite`
  driver; the 1.0 release candidate does, as in diarium. `zod` arrives with slice 0 because
  env names and `ALETHEIA_DB` are validated with it at the CLI edge.
- **Alternatives**: `drizzle-orm` `1.0.0-rc.4` (diarium's; fallback).

## R3. Store and migrations (ADR-0002)

- **Decision**: `DatabaseSync` from `node:sqlite` wrapped by `drizzle()` from
  `drizzle-orm/node-sqlite`. Before migrating, read `__drizzle_migrations` names (read-only):
  unknown names refuse; pending names in `prod` trigger the backup; then `migrate()` from
  `drizzle-orm/node-sqlite/migrator`. `migrations/` ships with a `.gitkeep` only.
- **Rationale**: `migrate()` runs all pending migrations inside one `BEGIN … COMMIT` and rolls
  back on error (read in the rc source), which is 000-US4-AS4. `readMigrationFiles` throws on a
  missing folder, so the folder must exist in the repo and in the package. The unknown-names
  check is diarium's.
- **Alternatives**: a placeholder migration (no story); `drizzle-kit` now (nothing to
  generate, and knip would flag it unused) — it arrives with slice 1's first table.

## R4. CLI (ADR-0003)

- **Decision**: one `main(argv, context)` returning an exit code, with injected `stdout`,
  `stderr`, `vars`, `clock`, `defaultEnv`, `dataDir`, `migrationsDir`, `backupRoot` and
  `version`. commander with `exitOverride()` and `configureOutput()`; the store opens inside each
  action, so help, version and parse errors never open it. TOON via `encode`, JSON via
  `JSON.stringify` on one line.
- **Rationale**: tests drive the public interface through `main()` with `:memory:` or temp
  stores (Constitution IV), and one spawn test runs the real bin from a directory outside the
  repo (000-US1-AS1).

## R5. Release build (ADR-0005)

- **Decision**: `rolldown` `1.2.15`, called through its JS API from the release script, with
  `platform: 'node'`, ESM output `dist/aletheia.js`, the shebang kept, and `transform.define`
  injecting one constant, `__ALETHEIA_RELEASE__` (`{ version, commit, repoRoot }`). Only the
  release entry `src/shell/cli/released.ts` reads it; the source entry `bin.ts` never does, so
  no `typeof` fallback is needed. `package.json`: `bin` → `dist/aletheia.js`,
  `files: ["dist", "migrations"]`. The release finds migrations at
  `import.meta.dirname/../migrations`.
- **Rationale**: tried in scratch: `.ts` imports, `package.json` `imports`, commander, zod,
  drizzle `node-sqlite` and toon bundle into one ~530 KB file; `node:sqlite` stays external;
  the bundle runs from any directory. Rolldown is semver-stable since 1.0 (2026-05).
- **Alternatives**: `tsdown` `0.23.2` (same output, built on rolldown, 0.x with frequent
  option renames, library features not needed); `esbuild` `0.28.2` (works, output twice the
  size); `tsc` emit (no bundling, no `define`; dependencies would have to install at release);
  copying the sources (Angelo asked for a build that marks what is released).

## R6. Global install

- **Decision**: `pnpm pack --pack-destination .release`, then
  `pnpm add -g <absolute path to the tarball>`. The last tarball stays in `.release/`
  (gitignored). Before installing, the release extracts the tarball into a temp folder and runs
  its `dist/aletheia.js --help` and `--version`; after installing, it runs `aletheia --version`
  from PATH and compares.
- **Rationale**: tried on pnpm 10.31, 11.3, 11.28 and 12.15: a tarball installs a real copy,
  the bin lands on PATH, and reinstalling the same name and version replaces it. `pnpm link
  --global` is removed in pnpm 11 and `pnpm add -g <dir>` installs a symlink, which would run
  the working tree. pnpm 10 records the tarball path in a shared manifest and breaks if it is
  deleted, hence keeping it.
- **Alternatives**: `npm install -g <tarball>` (works, but with fnm the npm prefix belongs to
  the Node version, so `aletheia` would vanish on a Node switch).

## R7. Release script (spec US2)

- **Decision**: `pnpm release` → `node src/shell/release/bin.ts`. Steps: refuse unless the
  branch is `main` and `git status --porcelain` is empty; run `pnpm check`; build (R5); pack,
  smoke-run and install (R6); print `release: <version> (<commit>) installed`. The steps run
  through an injected command runner; tests use a fake one, so no test builds or installs
  (INV-01).
- **Rationale**: Constitution IV covers scripts; refusals and step order are testable without
  side effects. Angelo runs it himself after merging (spec Assumptions).

## R8. Environments (ADR-0001, superseded by ADR-0008)

- **Decision**: diarium's resolution with `ALETHEIA_*` names; the source entry defaults to
  `test` and finds `data/` and `migrations/` from its own location; the release defaults to
  `prod` and keeps its stores in `<home>/.aletheia/` (ADR-0008; ADR-0001 had it find `data/`
  under `__ALETHEIA_RELEASE__.repoRoot`). Under `VITEST` the entry
  passes no data folder and no backup root, so named envs and backups are refused (INV-01).
- **Rationale**: a bare `node src/shell/cli/bin.ts` can never reach `prod` by default.

## R9. Backup (spec US3)

- **Decision**: `backup()` from `node:sqlite` into `<name>.partial`, then `rename`; the iCloud
  Drive root `~/Library/Mobile Documents/com~apple~CloudDocs` must exist and only
  `aletheia-backups/` is created; names and the choice of copies to remove are pure functions in
  `src/core/backups`; retention 5 per env.
- **Rationale**: diarium's approach, except that diarium creates the folder recursively, which
  would invent an iCloud Drive path when iCloud is missing (000-US3-AS3 wants a refusal).

## R10. Lint and format (ADR-0006)

- **Decision**: `oxlint` `1.89.0` with plugins `typescript`, `unicorn`, `oxc`, `import`:
  - a local JS plugin `tools/lint/no-comments.ts` (rule `local/no-comments`, built with
    `@oxlint/plugins` `1.89.0`): every comment is an error except the shebang, with no
    exception for disable directives;
  - `unicorn/filename-case` kebab-case;
  - override `src/core/**`: `import/no-nodejs-modules` and `no-restricted-imports` for
    `node:*`, `drizzle-orm`, `#shell/*`;
  - `no-restricted-imports` for `node:sqlite` and `drizzle-orm` outside `src/shell/db/**`;
  - `sonarjs/cognitive-complexity` 15 from `eslint-plugin-sonarjs` `4.2.2` as a JS plugin.
  `oxfmt` `0.74.0`, `--check` over code and config files (`src`, `tests`, `tools`, `*.json`,
  `*.ts` at the root), not Markdown.
- **Rationale**: oxlint has no built-in rule against all comments; `eslint-plugin-no-comments`
  flags the shebang and its fix deletes it, while the local rule (tried) skips it and passes
  `tsc`. JS plugins are alpha in oxlint, the one risk of this stack; diarium enforces the same
  rules with eslint. Markdown is left out of `oxfmt` because specs and docs are written by Spec
  Kit and formatted by the editor.
- **Alternatives**: eslint as in diarium (the design asks for oxlint); allowing
  `oxlint-disable` directives (an escape hatch from every rule).

## R11. Dead code, duplication, tests

- **Decision**: `knip` `6.43.0` with entries `src/shell/cli/bin.ts`,
  `src/shell/cli/released.ts`, `src/shell/release/bin.ts`, `tools/lint/no-comments.ts`;
  `jscpd` `5.4.2` over `src` and `tests`; `vitest` `5.0.5`. `pnpm check` runs `test`, `lint`,
  `format:check`, `typecheck`, `dead-code`, `duplication` in that order and stops at the first
  failure.
- **Rationale**: the six checks of 000-US5-AS1.

## R12. Traceability and lint tests (spec US5)

- **Decision**: `tests/traceability.test.ts` collects every `NNN-USx-ASy` and every `INV-nn`
  defined in `specs/*/spec.md`, and fails listing the ids that no `*.test.ts` or eval file
  under `src/`, `tests/` or `evals/` contains. `tests/lint.test.ts` copies `.oxlintrc.json` and
  `tools/` into a temp folder, writes a `src/core` file importing `node:fs` and a file with a
  comment, runs `oxlint` there and expects both reported (000-US5-AS2).
- **Rationale**: "traceability is a grep" (Constitution IV); the lint test never writes inside
  the repo.

## R13. Constitution and design

- **Decision**: amend the constitution to 1.2.0 (Technology Constraints: development runs the
  sources, the release is a bundle installed outside the repo, the sources default to `test`;
  Development Workflow: Angelo runs `pnpm release` after a merge; Principle VI: a release build
  is not a generator, its output is never committed) and update design §10–§11.
- **Rationale**: the clarified spec contradicts "native type stripping" as the only way the CLI
  runs and "installed as diarium does"; the design is updated first (Development Workflow).
