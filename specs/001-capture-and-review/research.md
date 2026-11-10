# Research: Capture and Review

Facts were tried in scratch projects on Node 26.13.0 (SQLite 3.54.0), never in the repo or the
installed `aletheia`. Decisions marked **Angelo** were his, taken with options on the table.

## R1. Versions and new dependencies

- **Decision**: `ts-fsrs` 5.4.2, `date-fns` 4.4.0 with `@date-fns/tz` 1.5.0, and `drizzle-kit`
  1.0.0-rc.5, the pair of the `drizzle-orm` already pinned. All `devDependencies`: the first
  three are bundled into the release (slice 0, R2) and `drizzle-kit` only runs
  `pnpm db:generate`.
- **Rationale**: slice 0's rule, the newest stable release published at least two weeks
  before the plan (cutoff 2026-10-26), checked with `npm view <pkg> time`: `ts-fsrs` 5.4.2
  (2026-09-01; 6.0.0 is from 2026-10-28), `date-fns` 4.4.0 (2026-05-29), `@date-fns/tz` 1.5.0
  (2026-05-21), `drizzle-kit` 1.0.0-rc.5 (2026-10-21). None imports `node:*`, so `src/core`
  may use the first three (Constitution VI).
- **Alternatives**: `ts-fsrs` 6.0.0 (R6); `Temporal` instead of `date-fns` (R7).

## R2. Schema: three tables

- **Decision**: `cards`, `card_tags` and `reviews` ([data-model.md](./data-model.md)). Tags in
  their own table; key points as a JSON array on the card; FSRS state in plain columns;
  instants as UTC ISO text; `status` on the card from now.
- **Rationale**: slice 3 filters by tag and slice 5 groups by tag, which a table answers with
  an index and a `GROUP BY`, and its primary key makes a card's tags unique for free. Key
  points are always read with their card and never queried alone; `json_array_length` checks
  the count. The due list filters on `due` and `state`, and later stats read stability and
  lapses, so columns beat a blob. ISO text is readable in a backup and sorts as time. The
  design's domain lists `status`; slice 6 adds the archive reason with `ADD COLUMN`, no rebuild.
- **Alternatives**: tags as a JSON array (no index, uniqueness and the character check need
  code); key points in a table (three joins for a list of three); FSRS state as one JSON column
  (the due list would parse every row); epoch milliseconds (opaque when reading a store by hand).
- **Reversibility**: each of these moves with one migration and loses nothing.

## R3. Card id (Angelo)

- **Decision**: a random 4-character code from Crockford's base 32 in lowercase
  (`0-9a-hjkmnp-tv-z`: no `i`, `l`, `o`, `u`), e.g. `k7m2`, the table's primary key. The shell
  draws each character with `randomInt` from `node:crypto`, behind an injected port so tests
  fix the ids; a collision retries with a new draw.
- **Rationale**: Angelo chose a code over a consecutive number. Four characters give 1,048,576
  ids; at 1,000 cards a draw collides once in a thousand, and the primary key catches it. The
  alphabet drops the letters that read as digits and the vowel that spells words.
- **Alternatives**: a consecutive integer (`#12`: shortest, offered and declined); `nanoid` (a
  dependency for four characters); a UUID (not quotable in chat).

## R4. What a review keeps (Angelo)

- **Decision**: besides card, final grade, instant, answer and rationale, a review keeps
  `claude_grade` and `state_before`. "Changed after a dispute" is no longer stored: it is
  `grade <> claude_grade`.
- **Rationale**: both exist only at review time. Claude's grade says in which direction
  disputes go (twelve Good → Easy out of fourteen means the skill is stingy with Easy); a flag
  only counts them, and Claude can no longer set it wrong. The state before tells a lapse (Again
  on a `review` card) from a first-day miss (Again on a `new` or `learning` card), which
  retention in slice 5 needs; replaying the log to rebuild it breaks the day the learning steps
  change, and they already changed once (spec Clarifications).
- **Alternatives**: the spec's boolean (loses the direction); the whole `ts-fsrs` review log
  (stability, difficulty and intervals before the review: no stat in the design reads them).
- **Spec and design**: the Review entity, FR-005, 001-US2-AS2 and design §5 now name both.

## R5. Rules the store enforces

- **Decision**: `CHECK` constraints declared in the Drizzle schema, foreign keys, the tag
  primary key, and three triggers for INV-02 in a custom migration
  (`drizzle-kit generate --custom`).
- **Rationale**: Constitution III rejects corruption at write time, by `CHECK` where SQL can
  express the rule. Tried: `drizzle-kit` 1.0.0-rc.5 emits the `check()` constraints and the
  `<timestamp>_<name>/migration.sql` layout ADR-0002 expects, with a `snapshot.json` beside
  it that the migrator ignores; `node:sqlite` has foreign keys on by default; a
  `BEFORE DELETE`/`BEFORE UPDATE` trigger with `RAISE(ABORT, …)` refuses the statement and a
  trigger body survives the `--> statement-breakpoint` split. The refusals are listed in
  data-model.md.
- **Alternatives**: validation in the CLI only (a bug in a later command could write what the
  rule forbids); revoking deletes by convention (nothing to revoke in SQLite).

## R6. Scheduling (ADR-0012; version chosen by Angelo)

- **Decision**: `fsrs(generatorParameters({ learning_steps: ['10m'] }))` from `ts-fsrs` 5.4.2:
  FSRS-6 with its default weights, retention 0.9, no fuzz, short-term steps on, one 10-minute
  learning step and the default 10-minute relearning step. Only `src/core/scheduling` imports
  `ts-fsrs` (lint), and it maps a card row to the library's card and back; the clock is passed
  in. A new card is `createEmptyCard(now)`: due at once.
- **Rationale**: the spec's clarified first day (Good is not repeated; Again or Hard comes
  back once). Measured: new + Again → 10 min, + Hard → 15 min, + Good → 2 days, + Easy →
  8 days; a Good after a step → 1 day; Again on a learned card → 10 min (data-model.md, Card
  states). A card rebuilt from its stored ISO text schedules exactly as the original, and 5.4.2
  ignores `elapsed_days`, so that field is not stored.
- **`ts-fsrs` 6.0.0, reviewed at Angelo's request** (release notes and both versions run side
  by side): a new async `DefaultScheduler` backed by a new dependency
  (`@open-spaced-repetition/srs-kit` 1.0.0) that defaults to FSRS-7; the `fsrs()` API used
  here stays but is deprecated and fixed to FSRS-6, where it schedules exactly as 5.4.2; the
  card gains `stabilityFast` and renames its fields (`dueAt`, `lastReviewAt`), with fractional
  days; leech handling, statistics and a `Reschedule` that replays review history ship as
  middleware; Node 24 or later. FSRS-7 with the same 10-minute step: Again → 10 min, Hard →
  14 h, Good → 4.8 days then 26, Easy → 54 days then 233, against 2 then 11 and 8 then 39
  days in FSRS-6.
- **Alternatives**: 6.0.0 with `fsrs()` (a deprecated API from day one, for no gain); 6.0.0
  with `DefaultScheduler` and FSRS-7 (twelve days old, far wider intervals nobody has lived
  with, different columns). Angelo chose 5.4.2 and asked to note the migration: design §14.
  The review log is never deleted, so a later model can be fed by replaying it.

## R7. Time: stored in UTC, shown in local time (Angelo)

- **Decision**: every instant is stored as UTC ISO text. The CLI prints instants in the local
  time of whoever runs it, as ISO with the offset (`2026-11-11T21:00:00-05:00`). "Today" is
  the local day. The entries read the system zone
  (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and inject it as `CliContext.timeZone`;
  tests fix it. `date-fns` and `@date-fns/tz` do the arithmetic, and only `src/core/time`
  imports them (lint): the rest of the code asks for "the instant as stored", "the instant as
  shown", "where today ends" and "20 minutes later".
- **Rationale**: Angelo's rule, "we store the time in UTC and the system shows it in each
  user's time", and his request for a date library kept behind one module (Constitution VI
  names dates among the problems to hand to a library). Converting a zone is a fact, so it
  belongs to code (Constitution II): at 9 pm in Bogotá the UTC date is already tomorrow, and a
  Claude that subtracts five hours wrong tells Angelo the wrong day. Tried: 02:00Z shows as
  21:00-05:00 in `America/Bogota` and 03:00+01:00 in `Europe/Madrid`; the local tomorrow starts
  at 05:00Z; the night Madrid changes its clock the next day still starts at local midnight.
- **Alternatives**: `Temporal`, built into Node 26 and tried with the same results (no
  dependency; Angelo prefers a library, and one module makes the swap cheap); UTC on stdout
  (Claude would convert); the UTC day as "today" (it would turn at 7 pm in Bogotá).

## R8. CLI commands (Angelo: grouped names)

- **Decision**: four commands in two groups: `aletheia card add`, `aletheia card show <id>`,
  `aletheia review due` and `aletheia review grade`. `card add` and `review grade` read JSON on
  stdin, validated with zod; `review grade` takes the card id, both grades, the answer and the
  rationale in one object. Output is TOON by default and JSON with `--json`, as `backup`.
- **Rationale**: Angelo chose groups over four loose verbs, so `archive`, `restore`, `stats`
  and `prune` find their place later. Stdin through a quoted heredoc (`<<'JSON'`) passes
  backticks, accents and multi-line code untouched; as an argument, quotes in the content break
  the shell. One object per grade means one schema and an error that names the field.
- **Alternatives**: `add`, `show`, `due`, `grade` (offered, declined); JSON as an argument
  (the design allowed it); flags for the grades and stdin for the text (two inputs to validate).

## R9. Where the skills live

- **Decision**: the global skill's source is `skills/az-aletheia-add/SKILL.md` at the repo
  root; the review skill is `.claude/skills/aletheia-review/SKILL.md`. Both call the installed
  `aletheia` and never `pnpm aletheia`, `--env` or a store path (001-US1-AS6, 001-US2-AS7).
- **Rationale**: under `.claude/skills/` the add skill would also load in this repo from the
  working tree, beside or instead of the released copy, and the skill and the CLI must come
  from the same release (constitution, Technology Constraints). Review is project-local by the
  design (§4).
- **Alternatives**: `.claude/skills/az-aletheia-add/` (the working tree's draft would reach
  Angelo's captures in this repo).

## R10. The release copies the global skill (ADR-0011)

- **Decision**: after the global install and its PATH check, `release()` copies
  `skills/az-aletheia-add/` from the repo into `<skills folder>/az-aletheia-add.partial`,
  swaps it for the previous copy and prints where it is. The skills folder is
  `~/.aletheia/skills/`, injected; the release entry passes none under vitest and `release()`
  refuses to copy without one (INV-01). Nothing is written under `~/.claude/`; the link there
  is Angelo's, created once.
- **Rationale**: FR-009 and 001-US1-AS7. The release runs from a clean `main`, so the tree is
  the released commit. The copy is the step that can fail, and it writes beside the live
  folder, so a failure leaves the previous copy whole. Copying after the install keeps the
  skill from running ahead of the CLI it calls.
- **Alternatives**: shipping the skill in the tarball and copying from pnpm's global folder
  (a path pnpm owns and changes between majors); a link into the repo (follows the working
  tree); copying before the install (a failed install would leave a newer skill over an older
  CLI).

## R11. Claude grades by category; Jev deferred

- **Decision**: the review skill grades in the conversation with the four FSRS grades of
  design §8.2, checking the answer against the card's key points and the type's rule (§7). No
  judge model or API is called, and no numeric score is produced.
- **Rationale**: FSRS takes exactly four grades, so a score would need invented thresholds to
  become one. Claude is already in the conversation, explains the grade and answers doubts; a
  judge model would add a network call per answer, a key and a dependency (the CLI makes no
  network calls), and still need Claude for the explanation. `claude_grade` next to `grade`
  (R4) measures how often and in which direction Angelo disputes, which is the evidence that
  would justify a judge.
- **Alternatives**: Jev by TypeSafe AI as a typed judge per key point, or as the judge of the
  skill's evals. Angelo asked; deferred, not rejected, and noted in design §14. What is known
  of it comes from search summaries read on 2026-11-09, not from its documentation.

## R12. Tests

- **Decision**: unit tests over `src/core` with a fixed clock, zone and id draws; CLI tests
  through `main()` with a temp store file in `ALETHEIA_DB` and stdin injected as text
  (`CliContext.stdin`); the INV-02 triggers tried with `runSql` from `tests/support/store`
  against a migrated temp store; the two skill files read as text (their Spanish triggers
  present; `pnpm aletheia`, `--env` and store paths absent); the skill copy over temp folders
  with the real file system. No eval is written (Constitution IV: after a second real failure).
- **Rationale**: the public interface is the CLI and the files on disk. Every scenario id
  (001-US1-AS1 to AS7, 001-US2-AS1 to AS8) and INV-02 appears in a test name, which
  `tests/traceability` already demands.
- **SC-003** is measured in the quickstart on a temp store with 1,000 generated cards.

## R13. Constitution, design and spec changes made while planning

- Constitution 1.5.0: tags are in English (Principle VII). 1.5.1: `date-fns` joins the stack,
  `ts-fsrs` and `date-fns` each sit behind one core module, instants are stored in UTC and
  shown in local time.
- Design: §5 review log (Claude's rating and the state before), tags in English, §10
  (`date-fns`), §14 (Jev, and the move to `ts-fsrs` 6).
- Spec: Clarifications of 2026-11-09 (review record, tags in English, time), FR-005, FR-006,
  001-US2-AS2, the Review entity and two assumptions.
