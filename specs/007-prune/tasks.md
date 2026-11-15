---

description: "Task list for 007-prune"
---

# Tasks: Prune

**Input**: Design documents from `specs/007-prune/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.6.0, ADRs 0002–0019

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario or invariant id they cover (`007-USx-ASy`, `INV-03`). Watch them fail, write the
minimum code, then refactor. Tests drive the public interface: `main(argv, context)` through
`cliOnTempStore`, the exported functions of `src/core`, the store through `tests/support/store`
for invariants, and the skill files on disk.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs, and each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 archive and restore, US2 said to be useless, US3 what Claude finds by
  reading, US4 keep, US5 thresholds
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slices 0 to 6's, unchanged:

- Code lives in `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one folder per
  module, with `.test.ts`, `.types.ts`, `.errors.ts`, `.constants.ts` and `.schema.ts` files
  each only when needed (ADR-0007).
- Units import each other through `#core/*` and `#shell/*` (ADR-0004), and only `src/shell/db`
  knows SQLite and Drizzle (ADR-0010). A repository is a port in `src/core` and a `Store…`
  class in `src/shell/db`.
- Every conventional literal (`3`, `6`, a reason, a message) is a named constant.
- No comments, and no call taking a call taking a call (lint).
- `pnpm db:generate --name <name>` for a schema change, `pnpm exec drizzle-kit generate
  --custom --name <name>` for triggers; read the SQL before committing it.

Shared by the tests of this slice:

- The clock: `NOW = new Date('2026-11-15T20:00:00.000Z')`, 15:00 in `America/Bogota`, the zone
  of `runCli`. Six months before it is `2026-05-15T20:00:00.000Z`.
- `tests/support/progress/progress.ts` (slice 6): `addTagged`, `studied`, `reviewed` (its
  `fields` take `flag: 'not-useful'`), `rowCounts`. Cards are archived, restored and kept
  through the CLI, never with `runSql`.
- `tests/support/reviews/reviews.ts`: `reviewOf`, for the core tests of `src/core/prune`.

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is closed (T001).** Angelo accepted research R1, R2 and ADR-0019 on 2026-11-15;
   the design caught up the same day.
2. **The traceability test stays red until T022.** A task closes with every check green except
   `tests/traceability`, and its list of missing ids shrinks by exactly the ids the task names.
3. **Fields land one task at a time.** CLI tests read `--json` and assert with
   `toMatchObject` on their task's fields. A new command's last task adds one test that fixes
   its TOON, and the contract takes whatever that test prints.
4. **Earlier tests restated by Angelo's decisions, not weakened.** Each is listed in the task
   that changes it: "4 failures weak, 3 not" becomes "3 weak, 2 not" (T010); the history's
   `flags` gain `not-useful: 0` and the `--flag` and `review grade` flag messages name it
   (T014); `settings show` and `settings set` give five rows and the longer `name a setting`
   message (T022); the stats skill's "4 failures" becomes the leech setting (T010).
5. **The archive is read through the card repository.** `CardRepository` gains
   `archive(card, reason, at)`, `restore(card, at)`, `archiveOf(id): { reason, at } | null`
   (the latest `card_status_history` row, when it is `archived`) and `all()`. `Card` itself
   does not change.
6. **One active-card check.** `activeCardById(repository, id)` in `src/core/cards/cards.ts`
   throws `CardArchivedError` (`card <id> is archived`) after `cardById`'s not found.
7. **Migrations ride with the task that needs them**, as in slice 5. Each rebuild of
   `reviews` is followed at once by the custom migration that restores its triggers, and the
   migrated-store `INV-02` test of slice 5 stays green through it.

---

## Phase 1: Setup (gate)

- [X] T001 The gate is closed (decision 1)
  - Design §8.3, §8.4, §9 and §13 updated (`4a79fa9`); ADR-0019 accepted (`2ec1e53`); R1 and R2
    accepted, the history table named `card_status_history` (`f55b3c3`).

---

## Phase 2: Foundational

Intentionally empty. Every table, type and field lands with the first task that needs it.

---

## Phase 3: Step 1 — Archive a card and get it back (US1)

**Goal**: "archiva #q3rt, ya no la uso" and "devuélveme #q3rt" work, and nothing is lost.

**Independent Test**: quickstart §1.

- [X] T002 [US1] `card archive` archives an active card with a reason, kept in `card_status_history`, in `src/shell/db/cards/` and `src/shell/cli/commands/card-archive/`
  - **Test**:
    - `src/shell/db/cards/cards.test.ts`:
      - `archive` sets `cards.status` to `archived` and adds one `card_status_history` row (`status: archived`, the reason, the instant), together; `archiveOf` returns `{ reason, at }`.
      - `INV-03 the store refuses to delete or change a card status change`: `delete from card_status_history` and `update card_status_history set reason = 'x'` both throw, on a migrated temp store.
      - The store refuses a row with `status: archived` and a blank reason, and one with `status: active` and a reason (`CHECK`).
    - `src/shell/cli/commands/card-archive/card-archive.test.ts`:
      - `007-US1-AS2 card archive archives an active card with its reason and instant, keeping its schedule and reviews`: `--json` prints the card with `status: archived`, `archiveReason` and `archivedAt` (`2026-11-15T15:00:00-05:00`); `due`, `state` and the review count are unchanged.
      - `007-US1-AS2 card archive refuses a blank reason, a missing card or an archived one, and changes nothing`: `invalid archive: reason: must not be blank`, `card zzzz not found`, `card <id> is archived`; `rowCounts` and the history row count unchanged after each.
      - An unknown field exits 1 with `invalid archive: <field>: not an archive field`.
    - `src/shell/cli/commands/card-show/card-show.test.ts`: an active card shows `archivedAt: null` and `archiveReason: null`.
  - **Code**:
    - `src/shell/db/cards/cards.schema.ts`: `cardStatusHistory` — "`status` `active` or `archived` (`CARD_STATUSES`)"; "`reason` not blank when `archived`; `null` when `active`"; `card_id` references `cards(id)`; `changed_at` not null. `pnpm db:generate --name card_status_history`, then a custom `card_status_history_never_change` with `card_status_history_never_deleted` and `card_status_history_never_changed`, worded as `reviews_never_deleted`.
    - `src/shell/db/cards/cards.ts`: `archive`, `archiveOf` (decision 5), in one transaction with `cards.status`.
    - `src/core/cards/`: `CardArchivedError`, `activeCardById` (decision 6), `archiveCard(draft, deps)`.
    - `src/shell/cli/commands/card-archive/`: group `card`, name `archive`; `card-archive.schema.ts` (`card`, `reason` not blank, strict); `card-archive.errors.ts` (`InvalidArchiveError`); prints `shownCard`. Registered after `cardEditCommand`.
    - `src/shell/cli/commands/card-show/card-show.ts`: `shownCard` gains `archivedAt` and `archiveReason` from `archiveOf`.
  - **Run**: quickstart §1, the first command
- [X] T003 [US1] An archived card leaves every list and progress, and its reviews stay in the history, in `src/shell/db/cards/cards.ts` and `src/shell/cli/invocation/progress/progress.ts`
  - **Test**: `card-archive.test.ts`, `007-US1-AS2 an archived card leaves review due, review topic, card list, tag list and tag stats, and its reviews stay in review history`: two cards under one tag, one reviewed and then archived; it is absent from `review due`, `review topic <tag>`, `card list`, `tag list` and `tag stats` (`deck.cards: 1`), and `review history --days 7` still gives its review.
  - **Code**: `CardRepository.all()`; `review history` reads reviews over `all()`, its tags still checked against the active cards (research R8). The other lists already read `active()`.
  - **Run**: quickstart §1
- [X] T004 [US1] `card restore <id>` makes an archived card active with the schedule it had, in `src/shell/cli/commands/card-restore/`
  - **Test**:
    - `cards.test.ts`: `restore` sets `cards.status` to `active` and adds a row `status: active`, `reason: null`; `archiveOf` is then `null`.
    - `src/shell/cli/commands/card-restore/card-restore.test.ts`:
      - `007-US1-AS3 card restore makes an archived card active with the schedule it had, back in every view`: archive, restore; `due`, `state`, `stability` as before; back in `card list` and `review due`. An overdue card is due now.
      - `007-US1-AS3 card restore refuses an active card or a missing one`: `card <id> is not archived`, `card zzzz not found`; nothing written.
      - Archive, restore, archive again: `card show` gives the second reason, and `card_status_history` holds three rows.
  - **Code**: `CardNotArchivedError`; `restoreCard` in `src/core/cards/cards.ts`; `restore` in `src/shell/db/cards/cards.ts`; command group `card`, name `restore`, argument `<id>`, prints `shownCard`.
  - **Run**: quickstart §1, the last command
- [X] T005 [US1] An archived card cannot be graded, edited or named as a prerequisite, in `src/core/reviews/reviews.ts` and `src/core/cards/cards.ts`
  - **Test**: `007-US1-AS4 review grade and card edit refuse an archived card, and review grade an archived prerequisiteOf`, in `src/shell/cli/commands/review-grade/review-grade.test.ts` and `card-edit/card-edit.test.ts`: each exits 1 with `card <id> is archived`; `rowCounts` unchanged.
  - **Code**: `gradeCard` uses `activeCardById` for `draft.card` and `draft.prerequisiteOf`; `editCard` for its card.
  - **Run**: quickstart §1, the grading point
- [X] T006 [US1] `aletheia-prune` is born: its triggers, and the archive and restore Angelo asks for by id, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Test**: `tests/skills/prune-skill.test.ts`, `007-US1-AS6 aletheia-prune carries its Spanish triggers, archives only on Angelo's choice with his reason, and restores a card he names`: the description holds `podemos el mazo`, `podemos <tema>`, `limpiemos el mazo`, `archiva #`, `devuélveme #`; the body holds `aletheia card archive`, `<<'JSON'`, `aletheia card restore`, `in his words`, `never on its own`, and no `pnpm aletheia`.
  - **Code**: the skill's frontmatter and a first section: confirm the card (`aletheia card show`), ask for the reason if Angelo gave none, archive with his words through a quoted heredoc, and restore by id. Spanish to Angelo, the installed `aletheia` only.
  - **Run**: `pnpm test -t 007-US1-AS6`

**Checkpoint**: 007-US1-AS2 to AS4 and INV-03 have tests.

---

## Phase 4: Step 2 — A pruned card does not come back unnoticed (US1)

**Goal**: a draft on something Angelo archived is caught at capture.

**Independent Test**: quickstart §2.

- [X] T007 [US1] `card search` finds archived cards too, marked with their reason, in `src/shell/db/cards/cards.ts` and `src/shell/cli/commands/card-search/card-search.ts`
  - **Test**: `src/shell/cli/commands/card-search/card-search.test.ts`, `007-US1-AS2 card search gives an archived card that matches the words, with its status and reason`: an archived card matching a word comes with `status: archived` and its `archiveReason`; an active one with `status: active`, `archiveReason: null`; an archived card sharing only a tag family is not given. The 002 tests stay green.
  - **Code**: `matching` drops the `status = active` condition; `similarCards` keeps `active()` for tag-family-only matches; `similarItem` gains `status` and `archiveReason`. The description says "the cards", not "the active cards".
  - **Run**: quickstart §2
- [ ] T008 [US1] `az-aletheia-add` quotes an archived match and offers drop, save or restore, in `skills/az-aletheia-add/SKILL.md`
  - **Test**: `tests/skills/add-skill.test.ts`, `007-US1-AS7 az-aletheia-add says when a draft matches an archived card, quoting it and its reason, and offers to drop the draft, save it or restore the card`: the text holds `status: archived`, `archiveReason`, `aletheia card restore` and the three choices.
  - **Code**: in the duplicate step: an archived match is shown as archived, with its stored question and Angelo's reason; he chooses to drop the draft, save it anyway, or restore the old card. It reaches `prod` with the release (CLAUDE.md).
  - **Run**: `pnpm test -t 007-US1-AS7`

---

## Phase 5: Step 3 — Leeches (US1)

**Goal**: "podemos el mazo" lists the leeches one at a time; "¿cómo voy?" says how many.

**Independent Test**: quickstart §3.

- [ ] T009 [US1] Move the failure rule to `#core/reviews` (pure refactor), in `src/core/reviews/reviews.ts` and `src/core/progress/progress.ts`
  - **Test**: none new; the 006 tests stay green unchanged.
  - **Code**: `isCounted` ("`policyOf(flag).countsInStats` and `stateBefore = review`") and `isFailure` ("counted, `grade = again`, and `flag ≠ missing-prerequisite`") move to `src/core/reviews/reviews.ts`, exported from its `index.ts`; `progress.ts` imports them.
  - **Run**: `pnpm test`
- [ ] T010 [US1] A leech is 3 failures, and weak follows it, in `src/core/progress/progress.constants.ts`
  - **Test** (decision 4): `progress.test.ts`'s `006-US1-AS3` cases become "3 failures make a card weak, and 2 do not", and `cardProgress`'s weak fixture uses 3; `tests/skills/stats-skill.test.ts` expects `3 failures` in place of `4 failures`. The test names keep their ids.
  - **Code**: `WEAK_FAILURES = 3`; the stats skill says "3 fallos o más".
  - **Run**: `pnpm aletheia tag stats`
- [ ] T011 [US1] `card candidates [tags...]` gives the leeches with their failures and last failure, in `src/core/prune/` and `src/shell/cli/commands/card-candidates/`
  - **Test**:
    - `src/core/prune/prune.test.ts`, through `candidates(input)`: a card with 3 counted failures is a candidate `reasons: ['leech']`, `failures: 3`, `lastFailure` its latest; 2 failures, a voided Again and a `missing-prerequisite` Again do not make one; archived cards are not in the input; order as saved.
    - `src/shell/cli/commands/card-candidates/card-candidates.test.ts`:
      - `007-US1-AS1 card candidates gives each leech of the deck or under the tags, with id, question, tags, reasons and evidence`: cards under two families, one failed 3 times in each; `--json` gives both; `messaging` gives one; a tag with no active card exits 1 with `no active card under …`. `rowCounts` unchanged.
      - `card candidates prints the candidates as TOON` (decision 3).
    - `tests/progress/performance.test.ts`: `SC-004 card candidates answers in under 1 second on 1,000 cards and 20,000 reviews`.
  - **Code**: `src/core/prune/` new: `prune.types.ts` (`PruneInput = { cards, topic, reviews, leechFailures }`, `Candidate`), `prune.constants.ts` (`CANDIDATE_REASONS = ['leech', 'not-useful'] as const`), `prune.ts` (`candidates`), `index.ts`. The command: group `card`, name `candidates`, `[tags...]` through `topicFrom`, returns `{ candidates, kept: [] }`. Registered after `cardListCommand`.
  - **Run**: quickstart §3, the first command
- [ ] T012 [US1] `tag stats` gives the deck's count of candidates, in `src/core/progress/progress.ts`
  - **Test**: `tag-stats.test.ts`, `007-US1-AS5 tag stats gives in its deck line how many cards are candidates`: one leech and one not → `deck.candidates: 1`; under a tag without it → `0`. `progress.test.ts`: the empty deck gives `candidates: 0`.
  - **Code**: `tagProgress` counts `candidates(…)` of its scope into `deck.candidates`; `ProgressInput` gains what `PruneInput` needs.
  - **Run**: quickstart §3, the second command
- [ ] T013 [US1] `aletheia-prune` lists the candidates one at a time and offers archive, rewrite in place or leave; `aletheia-stats` names the count, in `.claude/skills/aletheia-prune/SKILL.md` and `.claude/skills/aletheia-stats/SKILL.md`
  - **Test**: `prune-skill.test.ts`, `007-US1-AS6 aletheia-prune lists the candidates from aletheia card candidates one at a time, with reason and evidence, and offers archive or rewrite in place`: the text holds `aletheia card candidates`, `one at a time`, `wait for Angelo`, `aletheia card edit`, `same knowledge`. `stats-skill.test.ts`: `007-US1-AS6 aletheia-stats mentions the candidates count of tag stats`, the text holds `candidates` and `podar`.
  - **Code**: the prune skill's section 2: run `card candidates` (with the topic's tags when Angelo named one, found as the stats skill does), show each candidate with its question, reasons and evidence in Spanish, wait for his choice; rewrite in place as the review skill does (004 US3), only for the same knowledge. The stats skill names `deck.candidates` when it is above 0 ("hay 2 para podar").
  - **Run**: `pnpm test -t 007-US1-AS6`

**Checkpoint**: every id of US1 has its test.

---

## Phase 6: Step 4 — Said to be useless (US2)

**Goal**: "esto no me sirve" in a review makes a candidate.

**Independent Test**: quickstart §4.

- [ ] T014 [US2] `review grade` takes the flag `not-useful`, which counts as no flag, in `src/core/reviews/reviews.constants.ts` and `src/shell/db/reviews/reviews.schema.ts`
  - **Test**:
    - `src/core/reviews/reviews.test.ts`: `policyOf('not-useful')` is `NO_FLAG`.
    - `review-grade.test.ts`, `007-US2-AS1 review grade records a not-useful review and schedules it as with no flag`: same `due` and `state` as an unflagged grade of a twin card; it counts toward retention in `tag stats` and toward the session in `review due`.
    - `src/shell/db/reviews/reviews.test.ts`: the two `INV-02` trigger tests go red after the generated migration and green after the custom one (decision 7).
    - Restated (decision 4): the flag messages of `review-grade.test.ts` and `review-history.test.ts` name `not-useful`; `review-history.test.ts`'s `flags` gain `not-useful: 0`.
  - **Code**: `REVIEW_FLAGS` gains `not-useful`, `FLAG_POLICIES` maps it to `NO_FLAG`. `pnpm db:generate --name not_useful`, then `drizzle-kit generate --custom --name reviews_never_change_after_not_useful` with both triggers word for word.
  - **Run**: quickstart §4, the grade
- [ ] T015 [US2] `card candidates` gives a card with a `not-useful` review, with its latest one's instant and rationale, in `src/core/prune/prune.ts`
  - **Test**: `prune.test.ts`: two `not-useful` reviews → `reasons: ['not-useful']`, `notUseful` the latest's `{ at, rationale }`; a leech with one → `reasons: ['leech', 'not-useful']`, one row. `card-candidates.test.ts`: `007-US2-AS2 card candidates gives a card said to be useless, with the instant and rationale of its latest not-useful review`.
  - **Code**: the `not-useful` rule of data-model.md, without keeps yet.
  - **Run**: quickstart §4
- [ ] T016 [US2] `aletheia-review` flags a review `not-useful` when Angelo says a card adds nothing, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `tests/skills/review-skill.test.ts`, `007-US2-AS3 aletheia-review grades as usual and flags not-useful, quoting Angelo, when he says a card adds nothing, and archives nothing`: the text holds `esto no me sirve`, `esto lo sé de memoria`, `"flag": "not-useful"`, `quote his words in the rationale`, `prune will list it`, and no `aletheia card archive`.
  - **Code**: a rule beside the other flags: grade the answer as usual; when the review already carries a flag, keep it and put his words in the rationale (spec Edge Cases).
  - **Run**: `pnpm test -t 007-US2-AS3`

**Checkpoint**: every id of US2 has its test.

---

## Phase 7: Step 5 — A kept card is not proposed again (US4)

**Goal**: "consérvala" holds until a new failure or six months.

**Independent Test**: quickstart §5.

- [ ] T017 [US4] `card keep <id> --reason <reason> [--overlaps <id>]` records a keep, in `src/core/prune/` and `src/shell/db/keeps/`
  - **Test**:
    - `src/shell/db/keeps/keeps.test.ts`: `INV-03 the store refuses to delete or change a keep`; the store refuses an unknown reason, `overlapping` without `overlaps`, another reason with it, and `overlaps = card_id` (`CHECK`).
    - `src/shell/cli/commands/card-keep/card-keep.test.ts`:
      - `007-US4-AS1 card keep records the card, the reason, the instant and, for an overlap, the other card`: `--reason leech` and `--reason overlapping --overlaps <id>`, each printing the keep.
      - `007-US4-AS1 card keep refuses an unknown reason, a misplaced --overlaps, a missing or archived card, and records nothing`: the messages of the contract, option ones joined by `; `.
      - `card keep prints the keep as TOON` (decision 3).
  - **Code**: `src/core/prune/`: `KEEP_REASONS = ['leech', 'not-useful', 'outdated-situation', 'overlapping'] as const`, `KeepRepository` (`save`, `all`), `keepCard` (`activeCardById` for both cards). `src/shell/db/keeps/`: `keeps.schema.ts` — "`reason` `leech`, `not-useful`, `outdated-situation` or `overlapping`"; "`overlaps` references `cards(id)`; not null exactly when `reason = overlapping`; `<> card_id`" — and `StoreKeepRepository`; `pnpm db:generate --name keeps`, then a custom `keeps_never_change`. The command: group `card`, name `keep`, argument `<id>`, options `--reason`, `--overlaps`, in `OPTION_FLAGS`.
  - **Run**: quickstart §5, the first command
- [ ] T018 [US4] `card candidates` leaves a kept reason out until new evidence or six months, and lists the recent keeps, in `src/core/prune/prune.ts` and `src/core/time/time.ts`
  - **Test**:
    - `src/core/time/time.test.ts`: `monthsBefore(NOW, 6, 'America/Bogota')` is `2026-05-15T20:00:00.000Z`.
    - `prune.test.ts`: a leech kept after its last failure is left out, and back after a failure later than the keep; a `not-useful` kept `2026-06-01` is left out, kept `2026-05-01` is back; a card that is a leech and kept only as `not-useful` stays a leech; `kept` lists keeps from `2026-05-15T20:00:00.000Z` on, newest first, `overlaps` `null` unless overlapping.
    - `card-candidates.test.ts`: `007-US4-AS2 card candidates leaves a kept leech out until a later failure, a kept not-useful for six months, and lists the recent keeps`. `tag-stats.test.ts`: a kept leech leaves `deck.candidates`.
  - **Code**: `monthsBefore(now, months, timeZone)` (research R7); `PruneInput` gains `keeps` and `keepStart`; `KEEP_MONTHS = 6` until T022; the rules of data-model.md's candidates table.
  - **Run**: quickstart §5
- [ ] T019 [US4] `aletheia-prune` records a keep only when Angelo chooses it, for the reason he was shown, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Test**: `prune-skill.test.ts`, `007-US4-AS3 aletheia-prune records a keep through aletheia card keep only on Angelo's choice, for the reason shown`: the text holds `aletheia card keep`, `--reason`, `the reason he was shown`.
  - **Code**: keep becomes the third choice of section 2, with what it means (a leech comes back after a new failure, the rest after six months).
  - **Run**: `pnpm test -t 007-US4-AS3`

**Checkpoint**: every id of US4 has its test.

---

## Phase 8: Step 6 — What Claude finds by reading (US3)

**Goal**: "podemos mensajería" also reads the topic for outdated situations and overlaps.

**Independent Test**: quickstart §6.

- [ ] T020 [US3] `card list --content` adds key points and situation, in `src/shell/cli/commands/card-list/`
  - **Test**: `card-list.test.ts`, `007-US3-AS1 card list --content gives each card under a tag with its id, question, key points and situation`; without `--content` the rows are as before.
  - **Code**: `CARD_LIST_OPTIONS` gains `--content` (no value), `card-list.schema.ts` a boolean; the rows gain `keyPoints` and `situation` when it is set.
  - **Run**: quickstart §6
- [ ] T021 [US3] `aletheia-prune` reads `PROFILE.md` and each topic, proposes outdated situations and overlaps, and offers no rewrite for an overlap, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Test**: `prune-skill.test.ts`, `007-US3-AS2 aletheia-prune reads PROFILE.md and each topic through aletheia card list --content, proposes outdated situations and overlaps as its judgment, skips what kept names, and for an overlap offers keep, archive one or leave for the merge`: the text holds `PROFILE.md`, `aletheia card list`, `--content`, `aletheia card search`, `outdated-situation`, `overlapping`, `--overlaps`, `kept`, `six months`, `my judgment`, `slice 8`, `go on`.
  - **Code**: section 3: after the CLI's candidates, the named topic or each topic in turn (from `aletheia tag list`), asking after each whether to go on; quote the situation against `PROFILE.md`, quote both questions of an overlap; skip a card `kept` names for that reason; for an overlap only keep the pair, archive one, or leave it, which records nothing. `PROFILE.md` is read, never edited here.
  - **Run**: `pnpm test -t 007-US3-AS2`

**Checkpoint**: every id of US3 has its test; with T022, every id of spec 007.

---

## Phase 9: Step 7 — Tune the thresholds (US5)

**Goal**: "pon el leech en 6 fallos" works, and `default` brings back 3.

**Independent Test**: quickstart §7.

- [ ] T022 [US5] `settings set --leech-failures <n> --keep-months <n>`, read by the candidates and progress, in `src/core/settings/` and `src/shell/db/settings/`
  - **Test**:
    - `settings-set.test.ts`, `007-US5-AS1 settings set changes the leech failures and the keep months, default brings back 3 and 6, and a value below 1 is refused`: `--leech-failures 0` and `--keep-months x` exit 1 with `--leech-failures: must be a whole number, 1 or more, or default` and its twin; `settings show` gives each with `default`.
    - `card-candidates.test.ts` and `tag-stats.test.ts`: `007-US5-AS1 the candidates and weak cards follow the leech setting from the next query`: with `--leech-failures 4`, a card with 3 failures is neither a candidate nor weak; with `default`, it is both. `--keep-months 1` brings back a `not-useful` kept two months ago.
    - Restated (decision 4): the 003 settings tests expect five rows and `name a setting: --session-size, --new-per-day, --new-share, --leech-failures or --keep-months`.
  - **Code**: `settings.schema.ts` gains `leech_failures` and `keep_months` — "integer, nullable, each `>= 1`"; `pnpm db:generate --name prune_settings`. `BUILT_IN_SETTINGS` gains `leechFailures: 3`, `keepMonths: 6`; `WEAK_FAILURES` and `KEEP_MONTHS` go; `progressInput` and `card candidates` read the settings.
  - **Run**: quickstart §7

**Checkpoint**: every id of spec 007 has its test; `tests/traceability` is green.

---

## Phase 10: Close

- [ ] T023 Close the slice's docs
  - In `CLAUDE.md` Commands, add `card archive` (JSON on stdin), `card restore <id>`, `card keep <id>` (`--reason`, `--overlaps`), `card candidates [tags...]`, `card list --content`, the settings `--leech-failures` and `--keep-months`, and `specs/007-prune/contracts/cli.md` to the contracts list. In Workflow's skills bullet, add `aletheia-prune` (local) beside the other two.
  - The contract takes the TOON and messages the tests fixed (decision 3).
  - Run quickstart §1 to §7 in `test` through `pnpm aletheia`.
  - `pnpm check` is green, traceability included.
  - Commit `docs: close slice 7 tasks`.
- [ ] T024 Hand off
  - Angelo merges `007-prune` into `main` and runs `pnpm release` from a clean `main`. Give him the commands and run neither.
  - The release backs up `prod` before the migrations, the `reviews` rebuild among them, and copies `az-aletheia-add` with its archived-match rule.
  - Then quickstart §8 in `prod`, and the Measures of `specs/007-prune/quickstart.md` after two weeks (SC-002, SC-003).

---

## Dependencies & Execution Order

- T001 is done.
- Step 1: T002 → T003 → T004 → T005; T006 after T004.
- Step 2: T007 needs T002 (`archiveOf`); T008 after T007.
- Step 3: T009 → T010 → T011 → T012 → T013. T011 needs T002 (archived cards out of the input).
- Step 4: T014 → T015 → T016; T015 needs T011.
- Step 5: T017 → T018 → T019; T018 needs T015.
- Step 6: T020 → T021; T021 needs T019 (`kept`).
- Step 7: T022 needs T018.
- T023 needs all of them, and T024 needs T023.

## Parallel Opportunities

- T006 (skill file) shares no file with T005.
- T008 (`az-aletheia-add`) shares no file with T009.
- T016 (review skill) shares no file with T017.
- T020 (`card list`) shares no file with T017–T019, and can run once T011 is green.
- The prune skill tasks (T006, T013, T019, T021) share `SKILL.md` and `prune-skill.test.ts`;
  run them in order. Every core prune task touches `src/core/prune/prune.ts`; none runs in
  parallel with another.

## Implementation Strategy

1. **MVP**: Phases 3 and 4 (T002–T008). After a merge and a release, "archiva #…" and
   "devuélveme #…" work in `prod`, and a pruned card is caught at capture.
2. **Then** Phase 5 (leeches), Phase 6 (useless) and Phase 7 (keep): the CLI's half of prune.
3. **Last** Phase 8 (reading, P2) and Phase 9 (thresholds, P3). If the first five phases take
   the two days, these two move to a slice of their own (plan, Constitution Check V).
4. Commit after every green task on `007-prune`. Run `pnpm check` before closing each task,
   with the traceability exception of decision 2.
