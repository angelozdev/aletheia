# Aletheia Constitution

## Core Principles

### I. Daily Use Over Infrastructure
The system MUST be usable in `prod` from slice 1 and MUST be used from then on. Every slice
MUST end with something Angelo can do that day: capture a card, review, read progress, prune.
A slice that only delivers scaffolding is not done, with one exception: slice 0, the skeleton,
which exists so that slice 1 can be used on its first day. No feature is built without a user
story Angelo will exercise.
Rationale: propositum and diarium v0 died building infrastructure before daily use.

### II. Facts in Code, Judgment in Claude
Deterministic logic (FSRS scheduling, session and new-card caps, tag hierarchy, retention and
leech statistics, deterministic prune candidates, archive rules) MUST live in `src/core` with
tests. Judgment (drafting cards, grading free-form answers, usefulness, duplicates and
overlaps, telling a missing prerequisite from a badly written card) MUST live in skills and
`PROFILE.md`. A business rule in a prompt is a bug; an opinion in code is a bug.
Rationale: only the deterministic half can be unit tested; only the judgment half can adapt
to Angelo. Mixing them makes both untestable.

### III. Pure Core, Single Writer, Nothing Deleted
`src/core` MUST NOT perform I/O: no filesystem, SQL, network, or direct clock; time and
persistence enter as injected ports. Persistence goes through repository interfaces owned by
the core and implemented by adapters in `src/shell`; nothing outside an adapter knows the
database engine or the ORM. The `aletheia` CLI MUST be the only writer of data; Claude MUST
NEVER open or edit the database directly. Cards MUST NEVER be deleted: retiring a card archives
it with a required reason, and archived cards can be restored. Corruption MUST be rejected at
write time, by `CHECK` constraints where SQL can express the rule and by command validation
where it cannot.
Rationale: a pure core is testable with a fake clock and an in-memory database; the repository
boundary lets a Postgres adapter arrive later without touching the core; a single writer keeps
every write covered by tests; an archive with reasons keeps pruning reversible and explainable.

### IV. Test-Driven, Spec-Anchored (NON-NEGOTIABLE)
Everything is built test-first. No production code MAY be written without a failing test that
demands it: write the test for the scenario or invariant, watch it fail, write the minimum code
that passes, refactor. This applies to `src/core`, `src/shell/db`, `src/shell/cli`, lint rules
and scripts alike; a task in `tasks.md` starts with its test.
Three layers, all mandatory: unit tests over `src/core` and repositories; CLI tests through the
public interface (the `aletheia` commands and their output); regression evals that run a skill
headless against a fixture frozen from a real failure. No eval is written ahead of a failure:
the second time a skill misbehaves in real use, its state, with a frozen copy of the profile,
becomes a fixture and its eval, and that eval reruns whenever the skill changes. Every acceptance scenario in a spec
has an id (`NNN-USx-ASy`) and MUST appear in the name of the test or eval that covers it.
Invariants carry stable ids (`INV-nn`). Tests MUST pass before a Spec Kit task is closed.
Rationale: the LLM produces, the code verifies. Traceability is a `grep`, not a generator. A
test written after the code describes what it does, not what it must do.

### V. Small Slices, One-Page Specs
A slice takes one to two days. Its `spec.md` fits on one page. If writing the spec takes longer
than implementing it, the slice is too big and MUST be split. Every slice, slice 0 included,
goes through `/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`; nothing is implemented without a spec. Slice 0 (skeleton) has no card
behavior; its user stories are the commands Angelo runs to check it (`aletheia --help`,
`aletheia backup`). The slice order lives in the approved design.
Rationale: Spec Kit keeps the anchor and drops the weight; the skeleton fixes conventions
(environments, migrations, backup) that every later slice inherits, so it gets an anchor too.

### VI. Simplicity and YAGNI, Not Reinvention
One package. No monorepo, no server, no web UI or TUI, no vector database or embeddings, no
hosted database in v1. A typed ORM over the database is welcome; the only generator allowed is
the one that derives SQL migrations from the schema, and its output is reviewed and committed.
A release build is not a generator: its output is never committed.
Statistics are derived from the review log, not stored. Every feature MUST name the user story
it serves; a feature whose story is hypothetical goes to the design's Future section. Another
database engine arrives only as a new repository adapter, when Angelo asks for it.
YAGNI applies to features and architecture, never to well-solved problems. When a modern,
maintained, tested library solves a problem (scheduling, argument parsing, serialization,
dates, utilities such as `just-*`), it MUST be preferred over hand-rolled code. A library that
shapes architecture (driver, framework, ORM, scheduler, generator) needs an ADR; a utility
needs none. Libraries used in `src/core` MUST perform no I/O. Unmaintained or deprecated
packages are not "tested" in this sense.
Rationale: each removed piece is one fewer reason to stop using the system; each wheel rebuilt
is one more piece to maintain and one more place to be wrong.

### VII. English System, Spanish Content
Code, identifiers, CLI commands, ids, tags, commits, tests, specs, this constitution,
`CLAUDE.md`, skill files and docs MUST be in English. Card content (question, answer, key
points, situation, archive reasons), `PROFILE.md`, skill output to the user and the
conversation MUST be in Spanish, keeping technical terms in English.
Rationale: the system is portable and readable by any tool; the content is what Angelo studies,
in the language he thinks in, with the terms he will meet at work. A tag names a topic of the
system, not something to study: in English it has one spelling and needs no accent.

### VIII. Conversation, Not Commands
Angelo talks; Claude picks the skill and runs the CLI. No ritual MAY depend on Angelo
remembering a command, a skill name or typing `/`. Every skill's `description` MUST carry the
Spanish phrases that trigger it. Every question about the deck (what is due, progress, a card,
a tag) MUST be answered by running `aletheia …`, never from memory or from earlier in the
session.
Rationale: capture friction kills the habit; a brain that answers from memory is wrong after
the next review.

### IX. Quality Over Volume
The deck holds only what is worth remembering. Claude proposes and Angelo decides: no card is
saved, rewritten, split, merged or archived without his approval, and he can dispute a grade
before it is recorded. Every card MUST name a credible situation where knowing it matters; a
card without one does not enter. Cards MUST follow the quality rules of the approved design:
one idea or mechanism, an answer of one to three lines, a self-contained question that names
the technology and the variant when it matters, no trivia, nothing Angelo already knows, no
duplicates.
Rationale: the failure mode is a deck full of junk that Angelo stops trusting. A filter only
works if it acts at entry and at exit, and only Angelo knows what is worth his memory.

## Technology Constraints

- TypeScript on Node 26, `pnpm`, `node:sqlite` through Drizzle ORM
  (`drizzle-orm/node-sqlite`), `zod` at the CLI edge, `commander` with
  `@commander-js/extra-typings`, `ts-fsrs` for scheduling, `date-fns` for dates,
  `@toon-format/toon` for output, `vitest`. `ts-fsrs` and `date-fns` are each imported by one
  core module only. Instants are stored in UTC and shown in the local time of whoever runs
  the CLI. Development and tests run the sources through Node's native type stripping; the
  installed `aletheia` is a release, a bundle of `main` packed and installed globally by
  `pnpm release`. The schema lives in TypeScript as the source of truth; `drizzle-kit generate`
  derives numbered SQL migration files, reviewed and committed, applied at startup by
  Drizzle's migrator. What Drizzle cannot express (FTS5 virtual tables, triggers, `CHECK`
  constraints) is declared in the migration SQL.
- CLI output is TOON by default; `--json` switches to JSON. Commands that create or edit
  cards take JSON input validated with `zod`.
- `oxlint` and `oxfmt` lint and format; `knip` finds dead code; `jscpd` finds duplication.
  One lint rule enforces Principle III: `src/core` MUST NOT import `node:*`. Code carries no
  comments; names and extracted functions explain it.
- Code, specs, `PROFILE.md` and skills live in one directory, `~/me/aletheia`. `PROFILE.md` is
  ignored by git: it is Angelo's, and the skills read and edit it in place, only with his
  approval. The installed release is a build artifact outside it and holds no data. Its stores live in
  `~/.aletheia/<env>.sqlite`, outside the repo; the sources keep theirs in the repo's
  `data/<env>.sqlite`, ignored by git. `aletheia backup` exists from slice 0,
  copies the database into `backups/` in the same data folder, and runs before any migration
  in `prod`. Nothing aletheia writes lands in iCloud Drive or leaves the Mac.
- Environment resolution: `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > default by invocation.
  The installed binary `aletheia` defaults to `prod`; the development wrapper `pnpm aletheia`
  sets `ALETHEIA_ENV=test`, and the sources default to `test` however they run. Every command prints `env: <name>` on stderr; stdout stays clean.
  Tests use `:memory:`; evals copy fixtures to a temp path. Neither may reach `prod.sqlite`.
- The CLI performs no network calls.
- Only `az-aletheia-add` is a global skill: its source lives in this repo, `pnpm release`
  copies it into `~/.aletheia/skills/`, and
  `~/.claude/skills/az-aletheia-add` is a symlink to that copy, created once. It calls the
  installed binary so it works from any working directory, and both come from the same
  release; it reads the profile from `~/me/aletheia/PROFILE.md`, the one thing it does not take
  from the release. Review, stats and prune are project-local skills in `.claude/skills/`.

## Development Workflow

- Commits follow Conventional Commits, in English, small and frequent, on feature branches
  only, never on `main`. No pre-commit gates. Every task starts with its failing test
  (Principle IV); `pnpm test` is green before the task is closed, not on every commit.
- Development sessions use `pnpm aletheia`; `prod` is reached only by the installed binary or
  an explicit `--env prod`. Angelo runs `pnpm release` from a clean `main` after a merge; Claude
  gives him the command.
- Destructive operations (deleting data, resetting repos, uninstalling) are given to Angelo as
  commands to run, never executed by the agent.
- `docs/design/` holds the approved design; a change that contradicts it updates the design
  first, then the spec.
- Architecturally significant decisions (library, schema, module boundary, testing strategy,
  anything costly to reverse) are recorded as ADRs in `docs/adr/`: stable numbers,
  `proposed → accepted`, superseded rather than edited. `/speckit-plan` promotes qualifying
  `research.md` decisions to ADRs before `/speckit-implement` and links them from `plan.md`.
  Specs say what; ADRs say why.
- Skills are reviewed through evals, not by reading prompts. A prompt change reruns the evals
  of the affected skill; each eval carries the profile it was frozen with.

## Governance

This constitution supersedes any other practice in the repo, including skills, templates and
`CLAUDE.md`. Amendments are made by editing this file in a commit whose message starts with
`docs: amend constitution`, stating the version bump and the reason. Versioning: MAJOR for
removing or redefining a principle, MINOR for adding a principle or section, PATCH for
wording. Every `/speckit-plan` runs the Constitution Check against Principles I–IX and the
`accepted` ADRs; a violation is either fixed or justified in the plan's Complexity Tracking
table.

**Version**: 1.6.0 | **Ratified**: 2026-11-08 | **Last Amended**: 2026-11-10
