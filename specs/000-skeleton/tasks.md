---

description: "Task list for 000-skeleton"
---

# Tasks: Skeleton

**Input**: Design documents from `specs/000-skeleton/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.2.0, ADRs 0001–0006

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing test, named
by the scenario or invariant id it covers (`000-USx-ASy`, `INV-01`). Watch it fail, write the
minimum code, refactor. Tests drive the public interface: `main(argv, context)`, the source bin,
the exported core and `src/shell/db` functions, and `release(deps)` with a fake runner.

**Organization**: Phases follow the plan's delivery order (vertical slices), not the story
numbering. Each phase ends in something Angelo runs; each task carries the label of the story
it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

One package at the repo root: `src/core/<concept>/`, `src/shell/<adapter>/<concept>/`,
`tests/` for cross-cutting tests and `tests/support/` for helpers, `tools/lint/` for the local
oxlint rule. Imports across units go through `#core/*` and `#shell/*` barrels (ADR-0004);
inside a unit, relative `.ts` imports.

## Decisions taken while cutting tasks (Angelo may veto)

1. **ADR acceptance is a gate before T002**, as the plan's Constitution Check says ("Angelo
   accepts them before `/speckit-implement`"); the plan's slice 5 also lists it, so it is not
   repeated there.
2. **The repo-wide traceability test lands last (T029).** Wired in slice 1, it would stay red
   until every id has its test, so `pnpm check` and `pnpm release` could not go green in slices
   1–4. Slice 1 ships the tested function (000-US5-AS3); T029 points it at the repo.
3. **`pnpm release` runs the six checks one by one**, reading their names from the `check`
   script in `package.json`, so the refusal names the check that failed (contract) and the list
   lives in one place.
4. **Plan tree adjustments**: `src/shell/cli/invocation/context.ts` (source and release
   contexts, testable without the build) and `src/shell/cli/invocation/with-store.ts` (env
   line, open, run, close) are added; `tests/checks.test.ts` covers 000-US5-AS1; the barrels
   `src/shell/cli/index.ts` and `src/shell/release/index.ts` are created only if another unit
   imports them (knip would report them unused).
5. **New contract lines** (each added to `contracts/cli.md` by the task that emits it):
   `error: backups are disabled here (under vitest)`, `error: invalid --env "custom": custom is
   reserved for ALETHEIA_DB`, `error: invalid ALETHEIA_ENV "<value>": use lowercase letters,
   digits and dashes`, `release: refused: smoke run failed: <reason>`, `release: failed:
   aletheia on PATH prints "<x>", expected "<y>"`, `release: refused: package is missing
   migrations/`.

---

## Phase 1: Setup (shared setup exception)

**Purpose**: The gate and the minimum toolchain to write the first failing test. Config-only
tasks, no behavior, so no test (named exception).

- [X] T001 Gate: once Angelo accepts ADRs 0001–0006, change `**Status:** proposed` to `accepted` in each `docs/adr/000[1-6]-*.md` and in the index table of `docs/adr/README.md`; commit `docs(adr): accept 0001-0006`. Do not start T002 before Angelo says so.
- [X] T002 Create `package.json`, `pnpm-workspace.yaml` and `.gitignore` at the repo root and install the test toolchain
  - `package.json`: `"name": "aletheia"`, `"version": "0.0.0"`, `"private": true`, `"type": "module"`, `"engines": { "node": "26.x" }`, `"packageManager": "pnpm@11.28.8"`, `"imports": { "#core/*": "./src/core/*/index.ts", "#shell/*": "./src/shell/*/index.ts" }`, `"bin": { "aletheia": "dist/aletheia.js" }`, `"files": ["dist", "migrations"]`, scripts `"test": "vitest run"` and `"typecheck": "tsc --noEmit"`
  - `pnpm-workspace.yaml`: `saveExact: true` and an `allowBuilds` map with only the packages `pnpm install` asks about, set to `false` unless a task needs their build (none expected)
  - `.gitignore`: `data/`, `dist/`, `.release/`, `node_modules/`
  - `pnpm add -D typescript@7.0.2 @types/node@26.6.5 vitest@5.0.5` (every library is a `devDependency`: the release bundles them, R2)
- [X] T003 Create `tsconfig.json` and `vitest.config.ts` at the repo root
  - `tsconfig.json`: `strict`, `target: "esnext"`, `module`/`moduleResolution: "nodenext"`, `noEmit`, `allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `skipLibCheck`, `types: ["node"]`; include `src`, `tests`, `tools`, `*.ts`; do not set `rewriteRelativeImportExtensions`
  - `vitest.config.ts`: include `src/**/*.test.ts` and `tests/**/*.test.ts`, environment `node`
  - **Run**: `pnpm typecheck` passes (`pnpm test` reports no test files until T004)

---

## Phase 2: Foundational

Intentionally empty. Under vertical slicing every helper (`tests/support/*`), barrel, config
field and dependency lands with the first task that needs it, so nothing blocks the stories
beyond Phase 1.

---

## Phase 3: Slice 1 — `pnpm aletheia --help` and the six checks (US1, US2, US5) 🎯 first stop

**Goal**: The sources run through `pnpm aletheia` with help, `--version` → `dev` and parse
errors on stderr; the six checks exist and pass; lint enforces the boundaries and no comments.

**Independent Test**: `pnpm check` green; `pnpm aletheia --help` lists `--env` and `--json`;
`pnpm aletheia --version` prints `dev`; `pnpm aletheia --nope` exits 1 with the error on stderr.

- [X] T004 [US1] `pnpm aletheia --help` prints usage from any directory, in `src/shell/cli/main.ts` and `src/shell/cli/bin.ts`
  - **Test**: `tests/support/streams.ts` exports `captureStream()` → `{ write(chunk: string): boolean; text(): string }`. `src/shell/cli/main.test.ts`: `000-US1-AS1 --help prints usage with --env and --json on stdout and exits 0` — `main(['--help'], { stdout, stderr })` resolves `0`, stdout contains `Usage: aletheia`, `--env <name>` and `--json`, stderr is empty (no `env:` line). `src/shell/cli/bin.test.ts`: `000-US1-AS1 the source bin prints help from a directory outside the repo` — `spawnSync(process.execPath, [<absolute path of src/shell/cli/bin.ts>, '--help'], { cwd: <mkdtemp under os.tmpdir()>, encoding: 'utf8' })` exits 0, stdout contains `--env`, stderr empty
  - **Code**: `pnpm add -D commander@15.0.0 @commander-js/extra-typings@15.0.0`. `main.ts` exports `type CliContext = { stdout: Output; stderr: Output }` (`Output = { write(chunk: string): unknown }`) and `main(argv: string[], context: CliContext): Promise<number>`: a `Command` from `@commander-js/extra-typings` named `aletheia`, global options `--env <name>` ("use data/<name>.sqlite") and `--json` ("JSON instead of TOON on stdout"), `.exitOverride()`, `.configureOutput({ writeOut: s => context.stdout.write(s), writeErr: s => context.stderr.write(s) })`, `parseAsync(argv, { from: 'user' })`; a `CommanderError` whose `exitCode` is 0 returns 0, any other error is rethrown (T006 handles it). `bin.ts` starts with `#!/usr/bin/env node` and sets `process.exitCode = await main(process.argv.slice(2), { stdout: process.stdout, stderr: process.stderr })`. Script `"aletheia": "ALETHEIA_ENV=test node src/shell/cli/bin.ts"`
  - **Run**: `pnpm aletheia --help`
- [X] T005 [US2] `--version` from the sources prints `dev`, in `src/shell/cli/main.ts`
  - **Test**: `src/shell/cli/main.test.ts`: `000-US2-AS3 --version from the sources prints dev and opens no store` — `main(['--version'], { …, version: 'dev' })` → stdout exactly `dev\n`, exit 0, stderr empty
  - **Code**: `CliContext` gains `version: string`; `.version(context.version, '-V, --version')`; `bin.ts` passes `version: 'dev'`
  - **Run**: `pnpm aletheia --version` → `dev`
- [X] T006 [US1] An unknown option exits 1 with the error on stderr and nothing on stdout, in `src/shell/cli/main.ts`
  - **Test**: `src/shell/cli/main.test.ts`: `000-US1-AS5 an unknown option exits 1 naming it on stderr with nothing on stdout` — `main(['--nope'], …)` → `1`, stderr contains `error: unknown option '--nope'`, stdout `''`. (The unknown-command case needs a registered command; it lands in T019.)
  - **Code**: `main` returns 1 for any other `CommanderError` (commander already wrote `error: …` through `writeErr`)
  - **Run**: `pnpm aletheia --nope; echo $?` → `1`
- [X] T007 [US5] Lint fails when `src/core` imports `node:*`, `drizzle-orm` or `#shell/*`, in `.oxlintrc.json`
  - **Test**: `tests/lint.test.ts` with a helper `lintFixture(files: Record<string, string>)`: makes a `mkdtemp` folder, copies `.oxlintrc.json` (and `tools/` once it exists), symlinks the repo's `node_modules` into it so JS plugins resolve, writes `files`, runs the repo's `node_modules/.bin/oxlint` with `cwd` the temp folder, returns `{ status, output }`. Never writes inside the repo. Cases: `000-US5-AS2 lint fails naming a src/core file that imports node:*` (`src/core/sample/sample.ts` with `import { readFileSync } from 'node:fs'` → status ≠ 0, output contains `src/core/sample/sample.ts`); a `src/core` file importing `drizzle-orm` fails; a `src/core` file importing `#shell/db` fails; `src/shell/db/sample.ts` importing `node:fs` passes
  - **Code**: `pnpm add -D oxlint@1.89.0`. `.oxlintrc.json`: `plugins: ["typescript", "unicorn", "oxc", "import"]`; override `files: ["src/core/**"]` with `import/no-nodejs-modules: "error"` and `no-restricted-imports` forbidding `node:*`, `drizzle-orm`, `drizzle-orm/*`, `#shell/*`. Script `"lint": "oxlint"`
  - **Run**: `pnpm lint`
- [X] T008 [US5] Lint fails on any comment except the shebang, in `tools/lint/no-comments.ts`
  - **Test**: `tests/lint.test.ts`: `000-US5-AS2 lint fails naming a file with a comment` (`src/shell/sample.ts` with `// note`, `src/shell/other.ts` with `/* note */` → both paths in the output); a file whose only comment-like line is `#!/usr/bin/env node` passes; `// oxlint-disable` is itself reported (no escape hatch, ADR-0006)
  - **Code**: `pnpm add -D @oxlint/plugins@1.89.0`. `tools/lint/no-comments.ts` exports a plugin named `local` with rule `no-comments` that reports every comment of the file except the shebang. `.oxlintrc.json`: `jsPlugins: ["./tools/lint/no-comments.ts"]`, rule `local/no-comments: "error"`. `lintFixture` copies `tools/`
  - **Run**: `pnpm lint`
- [X] T009 [US5] Lint enforces the database boundary, kebab-case file names and cognitive complexity 15, in `.oxlintrc.json`
  - **Test**: `tests/lint.test.ts`: `src/shell/cli/sample.ts` importing `node:sqlite` fails and importing `drizzle-orm` fails; the same imports under `src/shell/db/sample.ts` pass; `src/shell/SampleFile.ts` fails `unicorn/filename-case`; a function with cognitive complexity above 15 fails `sonarjs/cognitive-complexity`
  - **Code**: `pnpm add -D eslint-plugin-sonarjs@4.2.2`; add it to `jsPlugins` with `sonarjs/cognitive-complexity: ["error", 15]`; `unicorn/filename-case: ["error", { "case": "kebabCase" }]`; top-level `no-restricted-imports` forbidding `node:sqlite`, `drizzle-orm`, `drizzle-orm/*`, turned off in an override for `src/shell/db/**`; the `src/core/**` override keeps its own stricter list (T007)
  - **Run**: `pnpm lint`
- [X] T010 [P] [US5] A function lists spec ids that no test or eval contains, in `tests/support/traceability.ts`
  - **Test**: `tests/traceability.test.ts`: `000-US5-AS3 lists the ids from a spec that no test or eval contains` — `missingIds({ specs: ['… **999-US1-AS1** … **999-US1-AS2** … INV-99 …'], tests: ["it('999-US1-AS1 works')"] })` → `['999-US1-AS2', 'INV-99']`, deduplicated and sorted. Fixtures use spec number `999` so they never cover a real id
  - **Code**: `missingIds` in `tests/support/traceability.ts`; ids are `/\b\d{3}-US\d+-AS\d+\b/g` and `/\bINV-\d{2}\b/g`; an id is covered when any test or eval text contains it. The repo-wide wiring is T029
- [ ] T011 [US5] `pnpm check` runs the six checks in order and stops at the first failure, in `package.json`
  - **Test**: `tests/checks.test.ts`: `000-US5-AS1 pnpm check runs test, lint, format, typecheck, dead-code and duplication in order` — reads `package.json`; `scripts.check` is exactly `pnpm test && pnpm lint && pnpm format:check && pnpm typecheck && pnpm dead-code && pnpm duplication`, and each of the six is a defined script
  - **Code**: `pnpm add -D oxfmt@0.74.0 knip@6.43.0 jscpd@5.4.2`; scripts `format` (oxfmt, writes), `format:check` (oxfmt `--check`), `dead-code` (`knip`), `duplication` (`jscpd`), `check` as above. oxfmt covers code and config only — `src`, `tests`, `tools`, root `*.ts` and `*.json` dotfiles included — never Markdown, `.specify/`, `.claude/`, `specs/`, `docs/` or `pnpm-lock.yaml`: use `ignorePatterns` in `.oxfmtrc.json` if oxfmt 0.74 supports it, else explicit paths in the scripts
- [ ] T012 [P] [US5] Configure dead-code detection in `knip.json`
  - entries `src/shell/cli/bin.ts` and `tools/lint/no-comments.ts` (T015 adds `src/shell/cli/released.ts`, T018 adds `src/shell/release/bin.ts`); `ignoreDependencies: ["eslint-plugin-sonarjs"]` (loaded only by `.oxlintrc.json`); vitest plugin on. **Run**: `pnpm dead-code` passes
- [ ] T013 [P] [US5] Configure duplication detection in `.jscpd.json`
  - `path: ["src", "tests"]`, `format: ["typescript"]`, default `minTokens`, `exitCode: 1` so any clone fails, console reporter. **Run**: `pnpm duplication` passes
- [ ] T014 [US5] Configure formatting in `.oxfmtrc.json`, after T012 and T013
  - ignore patterns per T011; run `pnpm format` once over the repo. **Run**: `pnpm check` passes end to end

**Checkpoint**: `pnpm check` green; `pnpm aletheia --help`; `pnpm aletheia --version` → `dev`.
Commit after each green task.

---

## Phase 4: Slice 2 — Release (US2, installed half of US1-AS1)

**Goal**: `pnpm release` turns a clean green `main` into the installed `aletheia`; elsewhere it
refuses and leaves the installed one alone.

**Independent Test**: on `000-skeleton`, `pnpm release` → `release: refused: on 000-skeleton,
not main`. After Angelo merges to `main`: `pnpm release` → `release: 0.0.0 (<commit>)
installed`; `cd /tmp && aletheia --help`; `aletheia --version` → `0.0.0 (<commit>)`; edit a help
text without committing: `aletheia --help` unchanged, `pnpm aletheia --help` shows the edit.

- [ ] T015 [P] [US2] The release entry prints `<version> (<commit>)` for `--version`, in `src/shell/cli/invocation/context.ts` and `src/shell/cli/released.ts`
  - **Test**: `src/shell/cli/invocation/context.test.ts`: `000-US2-AS3 the release context prints <version> (<commit>) for --version` — `main(['--version'], { ...releasedContext({ release: { version: '0.0.0', commit: '2033257', repoRoot: '/r' }, entryDir: '/pkg/dist', vars: {}, home: '/h' }), stdout, stderr })` → stdout exactly `0.0.0 (2033257)\n`; `the source context prints dev` with `sourceContext({ repoRoot: '/r', vars: {}, home: '/h' })`
  - **Code**: `context.ts` exports `type Release = { version: string; commit: string; repoRoot: string }` (data-model: `version` from `package.json`, `commit` the short SHA of `HEAD` on `main`, `repoRoot` the repo path), `sourceContext({ repoRoot, vars, home })` and `releasedContext({ release, entryDir, vars, home })`, each returning `CliContext` minus the streams (`version: 'dev'` / `` `${release.version} (${release.commit})` ``; later tasks add fields). `released.ts`: shebang, `declare const __ALETHEIA_RELEASE__: Release`, `process.exitCode = await main(process.argv.slice(2), { ...releasedContext({ release: __ALETHEIA_RELEASE__, entryDir: import.meta.dirname, vars: process.env, home: homedir() }), stdout: process.stdout, stderr: process.stderr })`. `bin.ts` switches to `sourceContext({ repoRoot: join(import.meta.dirname, '..', '..', '..'), vars: process.env, home: homedir() })`. Add `src/shell/cli/released.ts` to `knip.json` entries
- [ ] T016 [P] [US2] `pnpm release` refuses off `main`, with uncommitted changes or a failing check, in `src/shell/release/release.ts`
  - **Test**: `tests/support/fake-runner.ts` exports `fakeRunner(responses)`: records every `{ command, args, cwd }` and answers from a map keyed by `` `${command} ${args.join(' ')}` ``, default `{ status: 0, stdout: '', stderr: '' }`. `src/shell/release/release.test.ts`: `000-US2-AS2 refuses off main` (`git rev-parse --abbrev-ref HEAD` → `feature\n` → exit 1, stderr `release: refused: on feature, not main`); `000-US2-AS2 refuses with uncommitted changes` (`git status --porcelain` → ` M src/x.ts\n` → `release: refused: uncommitted changes`); `000-US2-AS2 refuses naming the failing check` (`pnpm run lint` → status 1 → `release: refused: lint failed`, later checks not run). In every refusal: `build` never called, no call to `pnpm pack` or `pnpm add -g`
  - **Code**: `release.ts` exports `type Runner = (command: string, args: string[], options?: { cwd?: string }) => Promise<{ status: number; stdout: string; stderr: string }>` and `release(deps: { run: Runner; build(release: Release): Promise<void>; packageJson: { version: string; scripts: Record<string, string> }; repoRoot: string; makeTempDir(): string; stdout: Output; stderr: Output }): Promise<number>`. Order: branch, clean tree, then each check named in `packageJson.scripts.check` (split on `&&`, drop the `pnpm ` prefix) as `pnpm run <name>` in `repoRoot`. Refusals go to stderr, exit 1
- [ ] T017 [US2] `pnpm release` builds, packs, smoke-runs and installs from a clean green `main`, in `src/shell/release/release.ts`
  - **Test**: `src/shell/release/release.test.ts`: `000-US2-AS1 builds, packs, smoke-runs and installs from a clean green main` — fake: branch `main`, clean tree, checks pass, `git rev-parse --short HEAD` → `2033257`, packed `--version` and `aletheia --version` → `0.0.0 (2033257)`. Assert in order: the six checks; `build({ version: '0.0.0', commit: '2033257', repoRoot })`; `pnpm pack --pack-destination .release` (cwd `repoRoot`); `tar -xzf <repoRoot>/.release/aletheia-0.0.0.tgz -C <tmp>`; `node <tmp>/package/dist/aletheia.js --help` and `--version` with cwd `<tmp>`; `pnpm add -g <repoRoot>/.release/aletheia-0.0.0.tgz`; `aletheia --version` with cwd `<tmp>`; stdout `release: 0.0.0 (2033257) installed\n`, exit 0. `refuses before installing when the packed CLI fails its smoke run` (packed `--version` → `dev` → `release: refused: smoke run failed: --version printed "dev", expected "0.0.0 (2033257)"`, no `pnpm add -g`). `reports a PATH mismatch after installing` (`aletheia --version` → `0.0.0 (1111111)` → exit 1, `release: failed: aletheia on PATH prints "0.0.0 (1111111)", expected "0.0.0 (2033257)"`)
  - **Code**: the steps above after the refusals; the tarball path is `<repoRoot>/.release/<name>-<version>.tgz` (verify pnpm 11's naming once by hand). The release never opens a store: `deps` carry no data path. Add the two new messages to `specs/000-skeleton/contracts/cli.md` § `pnpm release`
- [ ] T018 [US2] Wire `pnpm release`: the Rolldown build in `src/shell/release/build.ts` and the entry in `src/shell/release/bin.ts`
  - **Test**: none by design (R7, INV-01: no test builds or installs). `build.ts` is verified by the release's smoke run and once by hand below; `release()` is covered by T016–T017
  - **Code**: `pnpm add -D rolldown@1.2.15`. `build.ts` exports `buildRelease(release: Release)`: Rolldown `build()` with `input: <repoRoot>/src/shell/cli/released.ts`, `platform: 'node'`, `output: { file: <repoRoot>/dist/aletheia.js, format: 'esm' }`, `external: [/^node:/]`, `transform: { define: { __ALETHEIA_RELEASE__: JSON.stringify(release) } }`; the shebang must survive. `bin.ts`: reads `package.json`, runner over `node:child_process` (`encoding: 'utf8'`, never throws on non-zero status), `makeTempDir` with `mkdtempSync(join(tmpdir(), 'aletheia-release-'))`, `process.exitCode = await release(…)`. Script `"release": "node src/shell/release/bin.ts"`; add `src/shell/release/bin.ts` to `knip.json` entries
  - **Verify by hand once**: `node -e "import('./src/shell/release/build.ts').then(m => m.buildRelease({ version: '0.0.0', commit: 'manual', repoRoot: process.cwd() }))"`, then `cd /tmp && node ~/me/aletheia/dist/aletheia.js --version` → `0.0.0 (manual)` and `--help` lists `--env`, `--json`
  - **Run**: `pnpm release` on `000-skeleton` → `release: refused: on 000-skeleton, not main`, exit 1

**Checkpoint**: `pnpm check` green. Angelo merges when he wants to exercise the release, then
runs the Independent Test above (Claude gives the commands, never runs `pnpm release`).

---

## Phase 5: Slice 3 — Environments and backup (US3, US1-AS2…AS5, INV-01)

**Goal**: `aletheia backup` copies the current env's store to iCloud Drive, keeps 5 per env,
refuses cleanly when it cannot write; every command resolves its env by the contract's order
and says which on stderr; tests never reach `data/` or iCloud Drive.

**Independent Test**: `pnpm aletheia backup` → stderr `env: test`, stdout `path: …` and
`removed[…]`; open the copy it names and compare with `data/test.sqlite`; after a release,
`aletheia backup` → `env: prod`.

- [ ] T019 [US3] `aletheia backup` writes a consistent copy and prints its path, in `src/shell/cli/commands/backup.ts`, `src/shell/db/backups/backup.ts` and `src/core/backups/backups.ts`
  - **Test**:
    - `src/core/backups/backups.test.ts`: `backupFileName('prod', new Date('2026-11-08T21:04:05.123Z'))` → `prod-2026-11-08T21-04-05-123Z.sqlite` ("`<env>-<instant>.sqlite`, the instant as UTC ISO with `:` and `.` turned into `-`")
    - `src/shell/db/backups/backup.test.ts`: `000-US3-AS1 the copy opens as a store with the same content` (SC-003) — a temp store with a table and rows written through `node:sqlite`; `backupStore({ db, env: 'custom', root, now })` → file `<root>/aletheia-backups/custom-<instant>.sqlite` whose rows equal the store's; no `.partial` left
    - `src/shell/cli/commands/backup.test.ts`, through `main()` with `ALETHEIA_DB` = a temp file, `backupRoot` = a temp folder, a fixed `clock`: `000-US3-AS1 backup prints the copy written and none removed, TOON by default` (stdout is exactly `encode({ path, removed: [] })` from `@toon-format/toon` plus `\n`, i.e. `path: <root>/aletheia-backups/custom-2026-11-08T21-04-05-123Z.sqlite` then `removed[0]:`); `000-US3-AS1 --json prints the same fields as one-line JSON` (`{"path":"…","removed":[]}\n`); `000-US1-AS2 backup prints env: custom (<path>) as the first stderr line and only its result on stdout`; `backup --help opens no store and prints no env: line` (store file absent, stderr empty); `000-US1-AS5 an unknown command exits 1 naming it` (`['nope']` → stderr contains `error: unknown command 'nope'`, stdout empty; red until `backup` is registered); `000-US1-AS5 backup --bogus opens no store` (the `ALETHEIA_DB` file is never created)
    - extend `000-US1-AS1` in `src/shell/cli/main.test.ts` to assert `backup` is listed
    - `src/shell/cli/invocation/context.test.ts`: `INV-01 under vitest neither context has a backup root` (`vars: { VITEST: 'true' }` → `backupRoot: null`; otherwise `<home>/Library/Mobile Documents/com~apple~CloudDocs`)
  - **Code**:
    - `src/core/backups/backups.ts` + `index.ts`: `backupFileName(env, instant)`
    - `src/shell/db/database.ts`: `openStore(path)` / `closeStore(store)` over `DatabaseSync` (drizzle arrives in T024). `src/shell/db/backups/backup.ts`: `backupStore({ db, env, root, now }) → { path, removed }`; "The iCloud Drive root must exist; only `aletheia-backups/` is created" (non-recursive `mkdir`); "Written as `<name>.partial` through SQLite's online backup, then renamed" (`backup()` from `node:sqlite`, then `rename`). `src/shell/db/index.ts` exports `openStore`, `closeStore`, `backupStore`
    - `pnpm add -D @toon-format/toon@4.4.0`. `src/shell/cli/invocation/output.ts`: write a result (TOON `encode`, or `JSON.stringify` on one line with `--json`, plus `\n`), the `env:` line and `error: <message>` lines
    - `src/shell/cli/invocation/with-store.ts`: resolves the env (this task: `ALETHEIA_DB` only, shown as `env: custom (<path>)`; every other source is T022), writes the `env:` line, opens the store, runs the action, closes it; a thrown error becomes `error: <message>`, exit 1, nothing on stdout
    - `src/shell/cli/commands/backup.ts`: registers `backup` ("copy the current env's store to iCloud Drive"); `backupRoot === null` → `error: backups are disabled here (under vitest)` (add to `contracts/cli.md`)
    - `CliContext` gains `vars`, `clock: () => Date`, `backupRoot: string | null`; both contexts set them (`backupRoot` null when `vars.VITEST` is set)
  - **Run**: `ALETHEIA_DB=/tmp/aletheia-x.sqlite pnpm aletheia backup` and `… backup --json` (Angelo's run writes a real `custom-…` copy to iCloud Drive; tests never do)
- [ ] T020 [US3] A backup keeps the newest 5 copies of its env and touches nothing else, in `src/core/backups/backups.ts` and `src/shell/db/backups/backup.ts`
  - **Test**: `src/core/backups/backups.test.ts`: `000-US3-AS2 copiesToRemove keeps the newest 5 copies of the env` — six `prod-…` names, two `test-…`, `notes.txt`, `prod-backup.sqlite`, `prod-2026-11-08T21-04-05-123Z.sqlite.partial`, and env `pro` vs `prod-…` → only the oldest `prod-…` returned; five or fewer → `[]`. `src/shell/db/backups/backup.test.ts`: `000-US3-AS2 a sixth backup removes that env's oldest copy only` — folder seeded with 5 older `prod-…`, 2 `test-…`, `notes.txt` → 5 `prod-…` remain (the oldest gone), the rest untouched, result `removed: [<oldest absolute path>]`. `src/shell/cli/commands/backup.test.ts`: stdout shows `removed[1]: <path>`
  - **Code**: `copiesToRemove(env, names, keep = 5)` in core: "Only names matching `^<env>-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sqlite$` count; nothing else in the folder is touched" (escape `env`); `backupStore` removes them after the rename and returns their absolute paths
  - **Run**: six `ALETHEIA_DB=/tmp/aletheia-x.sqlite pnpm aletheia backup` → five `custom-…` copies
- [ ] T021 [P] [US3] A backup that cannot be written exits 1, leaves no copy and leaves the store unchanged, in `src/shell/db/backups/backup.ts`
  - **Test**: `src/shell/cli/commands/backup.test.ts`: `000-US3-AS3 a missing iCloud Drive root exits 1 naming it` (`backupRoot: <tmp>/missing` → stderr `error: iCloud Drive not found at <tmp>/missing`, stdout empty, `<tmp>/missing` still absent); `000-US3-AS3 an unwritable backup folder exits 1 with no copy left and the store unchanged` (`aletheia-backups/` at mode `0o500` → stderr `error: cannot write backup to <folder>: <reason>`, no `*.sqlite` or `*.partial` in the folder, store sha256 equal before and after; restore the mode in `afterEach`)
  - **Code**: in `backupStore`, check the root exists first; wrap `mkdir`, backup and rename failures into `cannot write backup to <folder>: <reason>`; remove the `.partial` on failure
- [ ] T022 [P] [US1] The env resolves `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > default and invalid values are refused before any store opens, in `src/shell/cli/invocation/env.ts`
  - **Test**: `src/shell/cli/invocation/env.test.ts` over `resolveEnv({ flag, vars, defaultEnv, dataDir })`: `000-US1-AS4 --env wins over ALETHEIA_DB, ALETHEIA_DB over ALETHEIA_ENV, ALETHEIA_ENV over the default` (table of cases); `--env x` → `<dataDir>/x.sqlite`; refusals with these exact messages: `invalid --env "Prod": use lowercase letters, digits and dashes`, `invalid --env "custom": custom is reserved for ALETHEIA_DB`, `invalid ALETHEIA_ENV "a b": use lowercase letters, digits and dashes`, `invalid ALETHEIA_DB "rel/x.sqlite": must be an absolute path`. `src/shell/cli/main.test.ts`, through `main()` with a temp `dataDir` and `backupRoot`: `000-US1-AS4 with --env, ALETHEIA_DB and ALETHEIA_ENV all set, backup uses --env` (stderr `env: staging`, `<dataDir>/staging.sqlite` created); `000-US1-AS4 an invalid env exits 1 before any store is opened` (nothing created in `dataDir`, stdout empty)
  - **Code**: `pnpm add -D zod@4.6.7`. `env.ts` validates with zod: name "`^[a-z][a-z0-9-]*$`, or `custom` when it comes from `ALETHEIA_DB` (reserved otherwise)"; dbPath "`<dataDir>/<name>.sqlite`, or the absolute path in `ALETHEIA_DB`". `CliContext` gains `defaultEnv` and `dataDir: string | null`; `with-store.ts` uses `resolveEnv` and creates `dataDir` if it is missing. Tests inject `dataDir`; the contexts get theirs in T023. Add the two new messages to `contracts/cli.md`
  - **Run**: `pnpm aletheia backup --env Bad; echo $?` → `error: invalid --env "Bad": …`, `1`
- [ ] T023 [US1] Each entry defaults to its env and data folder, and under vitest named envs are refused, in `src/shell/cli/invocation/context.ts`
  - **Test**: `src/shell/cli/invocation/context.test.ts`: `000-US1-AS3 the source context defaults to test under <repoRoot>/data and the release context to prod under the released repo's data/` (`sourceContext({ repoRoot: '/r', vars: {}, home: '/h' })` → `defaultEnv: 'test'`, `dataDir: '/r/data'`; `releasedContext({ release: { repoRoot: '/r', … }, … })` → `'prod'`, `'/r/data'`); through `main()` with `{ ...releasedContext({ release: { repoRoot: <tmp>, … }, vars: {}, … }), backupRoot: <tmpRoot> }` and `backup` → stderr `env: prod`, store `<tmp>/data/prod.sqlite`. `INV-01 under vitest the contexts have no data folder, so named envs are refused` (`vars: { VITEST: 'true' }` → `dataDir: null`; `backup` → exit 1, `error: named environments are disabled here (default: test); set ALETHEIA_DB to a temporary file`; `--env prod` → `(--env: prod)`; `ALETHEIA_ENV=x` → `(ALETHEIA_ENV: x)`). `src/shell/cli/bin.test.ts`: `INV-01 the source bin under vitest refuses its default env` (spawn `bin.ts backup` from a temp cwd with the inherited `VITEST` → exit 1 with that message)
  - **Code**: contexts set `defaultEnv` (`test` / `prod`) and `dataDir` (`<repoRoot>/data` / `<release.repoRoot>/data`, null when `vars.VITEST` is set); `resolveEnv` refuses a named env when `dataDir` is null, naming its source `--env`, `ALETHEIA_ENV` or `default`
  - **Run**: `pnpm aletheia backup` → `env: test`, `data/test.sqlite` created, a `test-…` copy in iCloud Drive; `pnpm aletheia backup --json`

**Checkpoint**: `pnpm check` green; quickstart §3 from the sources. After a merge and release,
`aletheia backup` → `env: prod` and a `prod-…` copy.

---

## Phase 6: Slice 4 — Migrations at startup (US4)

**Goal**: Every command that opens the store first refuses unknown migrations, then (backing up
first in `prod`) applies the pending ones all or none.

**Independent Test**: `pnpm test -t 000-US4` (named exception: exercised by fixture migrations
until slice 1 ships the first real one).

- [ ] T024 [US4] A new store is created with every migration applied before the command, in `src/shell/db/migrations/migrations.ts`
  - **Test**: `tests/support/fixture-migrations.ts`: `writeMigrations(dir, { '20261108000000_first': 'CREATE TABLE fixture_a (id integer primary key);', '20261108000100_second': … })` writes "`migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql`, statements split by `--> statement-breakpoint`". `src/shell/db/migrations/migrations.test.ts`: `000-US4-AS1 a new store is created with every migration applied` (`fixture_a`, `fixture_b` exist; `__drizzle_migrations` holds both names); `the shipped migrations folder opens a store` (the repo's `migrations/`, read only, over a temp store). `src/shell/cli/commands/backup.test.ts`: `000-US4-AS1 backup on a new store applies the migrations first` (stderr `env: custom (<path>)`, `migrated: 20261108000000_first`, `migrated: 20261108000100_second`, in order, then exit 0); `in a non-prod env pending migrations apply without a backup` (only the command's own copy in `aletheia-backups/`, no `backup: …` line)
  - **Code**: `pnpm add -D drizzle-orm@1.0.0-rc.5`. `database.ts`: `drizzle({ client: new DatabaseSync(path) })` from `drizzle-orm/node-sqlite`. `migrations.ts`: `pendingMigrations(db, migrationsDir)` (shipped folder names minus the names in `__drizzle_migrations`, read only if the table exists) and `applyMigrations(db, migrationsDir)` with `migrate()` from `drizzle-orm/node-sqlite/migrator`; `openStore` reports each applied name through a callback that `with-store.ts` turns into `migrated: <name>`. Create `migrations/.gitkeep`. `CliContext` gains `migrationsDir`: source `<repoRoot>/migrations`, release `<entryDir>/../migrations`
- [ ] T025 [US4] A `prod` store with pending migrations is backed up first; a current store reports nothing, in `src/shell/cli/invocation/with-store.ts`
  - **Test**: `src/shell/cli/commands/backup.test.ts`, `--env prod`, temp `dataDir`/`backupRoot`, fixture migrations, a clock that advances 1 ms per call: `000-US4-AS2 a prod store with pending migrations is backed up before they apply` (stderr exactly `env: prod`, `backup: <root>/aletheia-backups/prod-<instant>.sqlite (before migrating)`, then the `migrated:` lines; that copy lacks the fixture tables; the command then writes its own copy); `000-US4-AS3 a current store takes no backup and reports nothing about schema` (second run: stderr only `env: prod`, one new copy, no `backup:` or `migrated:` line). The pre-migration copy counts toward the 5 (Clarifications)
  - **Code**: `openStore` takes a `beforeMigrating(pending)` hook; `with-store.ts` passes one that, when the env is `prod` and `pending` is not empty, runs `backupStore` and writes `backup: <path> (before migrating)`
- [ ] T026 [US4] A failing migration keeps none of the pending ones and names itself, in `src/shell/db/migrations/migrations.ts`
  - **Test**: `src/shell/db/migrations/migrations.test.ts`: `000-US4-AS4 a failing migration keeps none of the pending ones` (`first` valid, `second` invalid SQL → throws naming `20261108000100_second`; `fixture_a` absent; `__drizzle_migrations` holds neither). `src/shell/cli/commands/backup.test.ts`: with `--env prod` → exit 1, stderr `error: migration 20261108000100_second failed: <reason>`, stdout empty, the pre-migration copy remains
  - **Code**: `applyMigrations` turns the migrator's error into `migration <name> failed: <reason>`. If the error does not carry the migration, match its failing statement against each pending migration's statements. If `migrate()` turns out not to roll back as R3 says, stop and report to Angelo before working around it
- [ ] T027 [US4] A store with migrations this code does not know is refused unchanged, in `src/shell/db/migrations/migrations.ts`
  - **Test**: `src/shell/cli/commands/backup.test.ts`: `000-US4-AS5 a store with migrations this code does not know is refused unchanged` — a store migrated with `first` and `second`, opened with a folder holding only `first`, `--env prod` → exit 1, stderr `error: the store has migrations this code does not know: 20261108000100_second`, store sha256 equal before and after, no copy written (checked before pending)
  - **Code**: `unknownMigrations(db, migrationsDir)`, checked in `openStore` before `pendingMigrations`
- [ ] T028 [P] [US4] `pnpm release` refuses a package that does not ship `migrations/`, in `src/shell/release/release.ts`
  - **Test**: `src/shell/release/release.test.ts`: `refuses before installing when the package has no migrations/ folder` — `tar -tzf <tgz>` lists `package/package.json` and `package/dist/aletheia.js` only → stderr `release: refused: package is missing migrations/`, no `pnpm add -g`. The `000-US2-AS1` fake adds `package/migrations/.gitkeep` to that listing
  - **Code**: after `pnpm pack`, list the tarball with `tar -tzf` and require a `package/migrations/` entry (FR-009). Add the message to `contracts/cli.md`

**Checkpoint**: `pnpm test -t 000-US4` and `pnpm check` green.

---

## Phase 7: Close (Polish & cross-cutting)

**Purpose**: Wire traceability to the repo, write `CLAUDE.md`, release to `prod`, walk the
quickstart.

- [ ] T029 Point traceability at the repo in `tests/traceability.test.ts`
  - **Test**: `reads ids from specs/*/spec.md and names from *.test.ts and evals/` — a temp tree with `specs/999-x/spec.md` holding `999-US1-AS1` and no test → `readTraceabilitySources(tmp)` then `missingIds` lists it; then `every scenario and invariant id in specs/*/spec.md is named by a test or eval` over the repo root → `[]`
  - **Code**: `readTraceabilitySources(root)` in `tests/support/traceability.ts`: `specs/*/spec.md`, every `*.test.ts` under `src/` and `tests/`, every file under `evals/` when it exists. An id still missing is a real gap: add its test, never weaken this one
- [ ] T030 [P] Write `CLAUDE.md` at the repo root (English, under 60 lines): develop with `pnpm aletheia`, never the installed `aletheia`; `pnpm check` before closing a task; test names carry `NNN-USx-ASy` / `INV-nn`; no comments; `#core/*` / `#shell/*` barrels; `src/core` pure; only `src/shell/db` touches `node:sqlite` and `drizzle-orm`; `pnpm release` and destructive commands are handed to Angelo; links to the constitution and `docs/adr/`
- [ ] T031 [P] Check `specs/000-skeleton/contracts/cli.md` and `specs/000-skeleton/quickstart.md` against the code: every `error:` and `release:` message emitted under `src/` appears in the contract, every quickstart command runs as written; fix the docs, not the code, unless the code contradicts the spec
- [ ] T032 Angelo merges `000-skeleton` into `main` and runs `pnpm release` (`src/shell/release/bin.ts`) from `~/me/aletheia` (Claude gives the commands, does not run them) → `release: 0.0.0 (<commit>) installed`
- [ ] T033 Walk `specs/000-skeleton/quickstart.md` §1–§5 with Angelo and record the measures in it: SC-002 (`time aletheia --help`, `time aletheia backup` under 1 s), SC-004 (`pnpm test` under 5 s), SC-005 (`time pnpm release` under 1 min), SC-003 (copy a backup over a scratch store, never `prod`, and `ALETHEIA_DB=<that file> pnpm aletheia backup` succeeds), SC-001 (fresh clone to released `aletheia` under 5 minutes)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: T001 is Angelo's gate; T002 → T003.
- **Foundational (Phase 2)**: empty.
- **Slice 1 (Phase 3)**: after Setup. T004 → T005 → T006 (same `main.ts`). T007 → T008 → T009
  (same `.oxlintrc.json`, `tests/lint.test.ts`). T010 anytime. T011 after T004–T009 (the checks
  must have something to check); T012, T013 after T011; T014 last.
- **Slice 2 (Phase 4)**: after Slice 1 (`release` runs `pnpm check`). T015 ∥ T016; T017 after
  T016; T018 after T015 and T017.
- **Slice 3 (Phase 5)**: after Slice 2 (T015's contexts). T019 → T020; then T021 ∥ T022;
  T023 after T022.
- **Slice 4 (Phase 6)**: after Slice 3 (`openStore`, `with-store.ts`, `backupStore`).
  T024 → T025 → T026 → T027; T028 anytime after T017.
- **Close (Phase 7)**: after all slices. T029 needs every id covered; T030 ∥ T031; T032 after
  T029–T031; T033 after T032.

### User Story Dependencies

- **US5 (checks)** first: the release refuses without them.
- **US2 (release)** needs US5's `pnpm check`; its source half (T005) needs only T004.
- **US1 (env)** and **US3 (backup)** grow together in Slice 3: the first command is what makes
  the `env:` line, the env order and INV-01 observable.
- **US4 (migrations)** needs US3's store opening and backup (backup before migrating).

### Within Each Task

- The **Test** sub-bullet first, run it, see it fail for the expected reason.
- Then the minimum **Code**; refactor while green; `pnpm test` green before closing the task.
- Commit after each green task on `000-skeleton` (Conventional Commits, English); never on
  `main`, never push.

### Parallel Opportunities

- T010 alongside T004–T009 (no shared files, no new dependency).
- T012 ∥ T013 (own config files).
- T015 ∥ T016 (`src/shell/cli/invocation/` vs `src/shell/release/`).
- T021 ∥ T022 (`src/shell/db/backups/` + `commands/backup.test.ts` vs `invocation/env.ts` +
  `main.test.ts`).
- T028 alongside T025–T027.
- T030 ∥ T031.
- Tasks that run `pnpm add` touch `package.json` and `pnpm-lock.yaml`: never run two at once.

---

## Parallel Example: Slice 2

```bash
Task: "T015 Release context prints <version> (<commit>) in src/shell/cli/invocation/context.ts and src/shell/cli/released.ts"
Task: "T016 pnpm release refusals in src/shell/release/release.ts with tests/support/fake-runner.ts"
```

## Parallel Example: Slice 3

```bash
Task: "T021 Backup cannot be written in src/shell/db/backups/backup.ts"
Task: "T022 Env resolution and validation in src/shell/cli/invocation/env.ts"
```

---

## Implementation Strategy

### First stop (Phase 3)

1. Phase 1, with Angelo's ADR acceptance first.
2. Phase 3: `pnpm aletheia --help`, `--version` → `dev`, `pnpm check` green.
3. **Stop and validate**: Angelo runs the Independent Test of Phase 3.

### MVP of slice 0 (Phases 3–5)

The constitution names slice 0's stories as `aletheia --help` and `aletheia backup`. After
Phase 5, a merge and a release give Angelo both, installed, on `prod`.

### Complete slice 0 (Phases 6–7)

Phase 6 makes schema changes apply themselves, which slice 1 needs on its first day. Phase 7
wires traceability, releases and walks the quickstart.

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks.
- Each test name carries the id it covers; T029 enforces it over the repo.
- No test may open a store under `data/`, write to iCloud Drive or change the installed
  `aletheia` (INV-01): tests inject temp `dataDir`, `backupRoot` and `ALETHEIA_DB`, and the
  release runs through a fake runner.
- A test that looks wrong is raised with Angelo, never weakened, skipped or deleted.
