---

description: "Task list for 004-gaps-and-rewrites"
---

# Tasks: Gaps and Rewrites

**Input**: Design documents from `specs/004-gaps-and-rewrites/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.6.0, ADRs 0002–0017

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario id they cover (`004-USx-ASy`). Watch them fail, write the minimum code, refactor.
Tests drive the public interface: `main(argv, context)` through `cliOnTempStore`, the exported
functions of `src/core` and `src/shell/db`, and the skill file on disk.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs; each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 a gap and its prerequisite, US2 a voided review, US3 a rewrite in place
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slices 0 to 3's, unchanged: `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one
folder per module with `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`, `<name>.errors.ts`,
`<name>.constants.ts` and `<name>.schema.ts`, each only when needed (ADR-0007); units import
each other through `#core/*` and `#shell/*`, one `index.ts` per unit (ADR-0004); only
`src/shell/db` knows SQLite and Drizzle (ADR-0010). Every failure named by its message is an
error class in its module's `.errors.ts`, without the `error: ` prefix the CLI edge adds; every
conventional literal (`'badly-written'`, a message) is a named constant. No comments
(`local/no-comments`); no call taking a call taking a call (`local/no-nested-calls`).

Shared by the CLI tests of this slice:

- a temp store per test from `cliOnTempStore({ clock, randomIndex })`
  (`tests/support/run-cli/run-cli.ts`). In `review-due.test.ts` the clock is its `let now`,
  `2026-11-12T02:00:00.000Z` by default: 21:00 of 2026-11-11 in `America/Bogota`, so the local
  today started at `2026-11-11T05:00:00.000Z` and tomorrow starts at
  `2026-11-12T05:00:00.000Z`. `review-grade.test.ts` keeps its `NOW`, `2026-11-09T15:00:00.000Z`;
- cards go in through `card add` with JSON built from `SAMPLE_DRAFT`
  (`tests/support/cards/cards.constants.ts`), with `tags` overridden through `taggedDrafts`
  where a tag matters;
- ids: the counting draw gives `0123`, `4567`, `89ab`, `cdef`, … in the order cards are saved;
- reviews are arranged by grading through `review grade`, and read back with
  `selectAll(cli.db, 'select … from reviews')` (`tests/support/store/store.ts`);
- lists are read with `--json` and asserted field by field (`toMatchObject`, ids in order).

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is closed (T001).** Angelo accepted ADR-0017 and the names of research R1 on
   2026-11-10; design §5 caught up.
2. **The traceability test stays red until T013.** Spec 004 defines 12 ids with no test yet. A
   task closes with every check green except `tests/traceability`, whose list of missing ids
   shrinks by exactly the ids the task names, as in slices 1 to 3.
3. **Both columns arrive in one migration, in T002.** Adding `CHECK`s rebuilds `reviews`, which
   drops its triggers; one rebuild means one restore. T002 tests the store's rules for both
   columns; `prerequisiteOf` reaches the CLI and the core in T003.
4. **The two review fixtures gain `null`s (research R10).** `REVIEW` in
   `src/shell/db/reviews/reviews.test.ts` and `graded()` in `src/core/sessions/sessions.test.ts`
   gain `flag: null` in T002 and `prerequisiteOf: null` in T003, because `Review` gains those
   fields. No assertion changes.
5. **Several tests may carry one id.** 004-US1-AS2 names a test in T002 (the flag's rules) and
   another in T003 (the prerequisite's), as 001-US2-AS6 does.
6. **`card edit` prints with `card show`'s function.** `shownCard` is exported from
   `src/shell/cli/commands/card-show/card-show.ts` and imported by `card edit`, not copied
   (jscpd).
7. **The flag policy grows one field per task (research R11, Angelo's Strategy).** T006 brings
   `FlagPolicy` with `schedule`, T007 adds `hidesUntilTomorrow`, T008 adds
   `countsAsIntroduced`, each when its failing test asks for it. No call site compares a flag
   with `BADLY_WRITTEN`.

---

## Phase 1: Setup (gate)

- [X] T001 Gate: Angelo accepts ADR-0017 (status `accepted` in `docs/adr/0017-a-review-carries-one-flag-and-the-card-it-was-a-prerequisite-of.md` and `docs/adr/README.md`) and the names of `specs/004-gaps-and-rewrites/research.md` R1 (`flag`, `prerequisiteOf`, `card edit`); design §5's review log says "at most one flag (`missing-prerequisite` or `badly-written`), and, when the card was asked as a prerequisite, the card it was asked for", in `docs/design/2026-11-08-aletheia-design.md` (R10); one commit each

---

## Phase 2: Foundational

Intentionally empty. Every type, port method, migration and field lands with the first task
that needs it.

---

## Phase 3: Step 1 — A gap is logged (US1)

**Goal**: a review flagged `missing-prerequisite` is logged and scheduled as an Again; a
contradictory flag is refused by the CLI and by the store.

**Independent Test**: `pnpm aletheia review grade` with `"grade":"again","flag":"missing-prerequisite"`, then the same with `"grade":"hard"`.

- [X] T002 [US1] `review grade` records a `missing-prerequisite` flag, and the store refuses every contradiction of both new columns, in `src/shell/db/reviews/reviews.schema.ts` and `src/shell/cli/commands/review-grade/review-grade.schema.ts`
  - **Test**:
    - `src/shell/db/reviews/reviews.test.ts`, in "the reviews table":
      - `accepts a missing-prerequisite Again, a badly-written review of any grade, and a prerequisite of another card` — `insertReview({ flag: 'missing-prerequisite', grade: 'again' })`, `insertReview({ flag: 'badly-written', grade: 'good' })`, and, with a second card saved in `beforeEach`'s style, `insertReview({ prerequisite_of: '<the second id>' })`; three rows.
      - the `refuses %s` table gains: `['a flag outside the two', { flag: 'trivia' }]`, `['a missing prerequisite that is not Again', { flag: 'missing-prerequisite', grade: 'hard' }]`, `['a card that is its own prerequisite', { prerequisite_of: 'k7m2' }]`, `['a prerequisite of a card that does not exist', { prerequisite_of: 'zzzz' }]`.
      - The two `INV-02` tests stay as they are; they go red when the generated migration drops the triggers, and green again with the custom one.
      - `record stores the flag` — `record({ ...REVIEW, grade: 'again', flag: 'missing-prerequisite' }, scheduleAfter(card, 'again', now))`; `select flag from reviews` gives `missing-prerequisite`; `since(now)` returns it with the flag.
    - `src/shell/cli/commands/review-grade/review-grade.test.ts`:
      - `004-US1-AS1 review grade logs a missing-prerequisite Again and reschedules the card like any Again` — `grade({ grade: 'again', claudeGrade: 'again', flag: 'missing-prerequisite' })` → exit 0; `select flag from reviews` gives `missing-prerequisite`; the card is `learning`, due `TEN_MINUTES_LATER`, as in 001-US2-AS4.
      - `004-US1-AS2 review grade refuses a missing-prerequisite that is not Again, and a flag outside the two` — `it.for`: `{ grade: 'hard', flag: 'missing-prerequisite' }` → stderr ends `error: invalid review: flag: missing-prerequisite needs the grade again\n`; `{ flag: 'trivia' }` and `{ flag: ['missing-prerequisite', 'badly-written'] }` → `error: invalid review: flag: must be missing-prerequisite or badly-written\n`. Each exits 1, `recordedReviews()` is empty and the card is still `new`.
  - **Code**:
    - `src/core/reviews/reviews.constants.ts`: `REVIEW_FLAGS = ['missing-prerequisite', 'badly-written'] as const`, `MISSING_PREREQUISITE` and `BADLY_WRITTEN` naming each. `reviews.types.ts`: `ReviewFlag = (typeof REVIEW_FLAGS)[number]`; `Review` gains `flag: ReviewFlag | null`; `ReviewDraft` gains `flag?: ReviewFlag`. Export them from `src/core/reviews/index.ts`.
    - `gradeCard` records `flag: draft.flag ?? null`.
    - `reviews.schema.ts`: `flag: text().$type<ReviewFlag>()` and `prerequisiteOf: text('prerequisite_of').references(() => cards.id)`; checks `reviews_flag` "`flag IS NULL OR flag IN ('missing-prerequisite','badly-written')`" (from `REVIEW_FLAGS`), `reviews_gap_is_again` "`flag IS NOT 'missing-prerequisite' OR grade = 'again'`", `reviews_prerequisite_of` "`prerequisite_of IS NULL OR prerequisite_of <> card_id`".
    - `pnpm db:generate --name review_flags`; read the SQL: it adds both columns and rebuilds `reviews` through `__new_reviews`. Then `pnpm exec drizzle-kit generate --custom --name reviews_never_change_again`, holding `reviews_never_deleted` and `reviews_never_changed` exactly as in `migrations/20261110005603_reviews_never_change/migration.sql`.
    - `src/shell/db/reviews/reviews.ts`: `reviewRow` and `reviewFrom` carry `flag` (`null` both ways). `reviews.types.ts` follows.
    - `review-grade.schema.ts`: `flag: oneOf(REVIEW_FLAGS).optional()`, and a refinement adding `missing-prerequisite needs the grade again` at path `flag` when the flag is `missing-prerequisite` and `grade` is not `again`. Messages in `review-grade.constants.ts`.
    - Fixtures of decision 4 gain `flag: null`.
  - **Run**: `pnpm aletheia review grade` with the flag, as in the Independent Test

**Checkpoint**: a gap is in the log; nothing reads it yet.

---

## Phase 4: Step 2 — The prerequisite asked next (US1)

**Goal**: a card asked as another's prerequisite is recorded with that card's id and counts
toward neither cap; the skill pulls it, or explains and offers one.

**Independent Test**: quickstart §1.

- [X] T003 [US1] `review grade` records the card a prerequisite was asked for, in `src/core/reviews/reviews.ts` and `src/shell/cli/commands/review-grade/review-grade.schema.ts`
  - **Test**: `review-grade.test.ts`, with a second card `4567` saved in the test:
    - `review grade records the card a prerequisite was asked for` — `grade({ card: '4567', grade: 'again', claudeGrade: 'again', prerequisiteOf: '0123' })` → `select card_id, prerequisite_of from reviews` gives `4567`, `0123`.
    - `004-US1-AS2 review grade refuses a card as its own prerequisite, or as the prerequisite of a card that does not exist` — `{ prerequisiteOf: '0123' }` (with `card: '0123'`) → `error: invalid review: prerequisiteOf: must be another card\n`; `{ prerequisiteOf: 'zzzz' }` → `error: card "zzzz" not found\n`. Each exits 1 with nothing recorded and the card still `new`.
    - `src/shell/db/reviews/reviews.test.ts`: `since returns the reviews at or after the instant` passes with `REVIEW` carrying `prerequisiteOf: null`; `record stores the prerequisite link` reads `prerequisite_of` back through `since`.
  - **Code**:
    - `Review` gains `prerequisiteOf: string | null`; `ReviewDraft` gains `prerequisiteOf?: string`. `gradeCard` calls `cardById(cards, draft.prerequisiteOf)` before recording when it is given, and records `prerequisiteOf: draft.prerequisiteOf ?? null`.
    - `reviewRow` and `reviewFrom` carry it.
    - `review-grade.schema.ts`: `prerequisiteOf: requiredText.optional()`, and a refinement adding `must be another card` at path `prerequisiteOf` when it equals `card`.
    - Fixtures of decision 4 gain `prerequisiteOf: null`.
  - **Run**: `pnpm aletheia review grade` with `"prerequisiteOf"`
- [X] T004 [US1] A pulled prerequisite counts toward neither the session's cap nor the day's new cards, in `src/core/sessions/sessions.ts`
  - **Test**:
    - `src/core/sessions/sessions.test.ts`, with a helper `pulled(cardId, reviewedAt, forCard, stateBefore)` built on `graded()`:
      - `a card whose first review in the session names a prerequisite takes no place` — scope `dueReviews(3)` plus a relearning card `p` due before `now`; reviews in the session: `graded('due-0', …)` and `pulled('p', …, 'due-0')`; size 2 → `p` is listed as a re-show, `due-1` fills the one place left, `capReached: false`.
      - `a later review of a pulled prerequisite in the session still takes no place` — the same, plus a second review of `p` in the session without `prerequisiteOf` → the same list.
      - `a new card first graded as a prerequisite does not count toward the day` — `newPerDay: 1`, one `pulled('p', today + 1h, 'x', 'new')` → one new card of `freshCards(2)` listed, `heldBack: 1`.
    - `src/shell/cli/commands/review-due/review-due.test.ts`: `004-US1-AS3 a prerequisite graded in a session counts toward neither the session's cap nor the day's new cards, even when it comes back` — three new cards `0123` (X), `4567` (P), `89ab` (Y). `review due --session-size 2 --new-per-day 2 --json` → keep `session`. Grade `0123` Again with `flag: missing-prerequisite`; grade `4567` Again with `prerequisiteOf: '0123'`. The list with `--session <session> --session-size 2 --new-per-day 2` → `cards` `['89ab']`, `heldBack: 0`, `capReached: false`. With the clock 10 minutes later, the same call lists `0123` and `4567` as re-shows and `89ab`, `capReached: false`.
  - **Code**: in `sessionList`, keep "shown in the session" (every card reviewed since `start`) for the re-shows, and count toward the cap only the cards whose first review since `start` has `prerequisiteOf === null`: the fill starts after them and `capReached` compares them with `sessionSize`. `introducedSince` leaves out reviews with a `prerequisiteOf`.
  - **Run**: quickstart §1, first two calls
- [X] T005 [US1] `aletheia-review` grades a missing base concept with the flag, asks a card that covers it before explaining, or explains and offers one, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `tests/skills/review-skill.test.ts`: `004-US1-AS4 aletheia-review grades a missing base concept Again with the flag, asks a card that covers it before explaining, or explains and offers one`. The text contains `"flag":"missing-prerequisite"`, `aletheia card search`, `"prerequisiteOf"`, `before explaining`, `two or three lines`, `az-aletheia-add`, `repaso #<id>` and `one prerequisite per failed card`.
  - **Code**: a section "A missing base concept", after "Settle and record the grade" (research R9):
    - When Angelo's answer shows a base concept is missing ("no recuerdo qué es un consumer group"), grade Again, and record it with `"flag":"missing-prerequisite"` once his reply settles it (a JSON example).
    - Then `aletheia card search` with the concept, its synonyms in Spanish and English, and the failed card's tags; read every card listed and judge whether one covers the concept.
    - If one does and was not shown in this session, ask it next, before explaining anything: its answer is the explanation. Record its grade with `"prerequisiteOf":"<id of the failed card>"`. It counts toward neither cap.
    - Otherwise, explain the concept in two or three lines (no lesson) and offer the card in a line; if Angelo says yes, use `az-aletheia-add` with the source `repaso #<id>`. A card created this way is not asked in this session.
    - One prerequisite per failed card. A prerequisite that fails for a base concept too is flagged and explained, and pulls nothing more.
  - **Run**: `pnpm test -t 004-US1-AS4`. The skill calls the installed `aletheia`, so Angelo uses it after the release (quickstart §4).

**Checkpoint**: US1 is complete; "no recuerdo qué es X" works after a release.

---

## Phase 5: Step 3 — A badly written review does not count (US2)

**Goal**: a voided review is logged and schedules nothing; its card leaves the lists until
tomorrow; it costs a place in the session and introduces no card.

**Independent Test**: quickstart §2.

- [X] T006 [US2] A voided review leaves the card's schedule as it was, in `src/core/reviews/reviews.ts`
  - **Test**: `review-grade.test.ts`: `004-US2-AS1 review grade logs a badly-written review with both grades and leaves the card's schedule unchanged` — `it.for(['again', 'good'])`: read `card show 0123 --json` before; `grade({ grade, claudeGrade: 'hard', flag: 'badly-written' })` → exit 0; the review row has `flag: badly-written`, both grades, the answer and the rationale; `card show 0123 --json` gives the same `due`, `state`, `learningSteps`, `reps`, `lapses`, `stability`, `difficulty`, `scheduledDays` and `lastReview` as before; stdout's `state` and `due` are the old ones.
  - **Code**:
    - `src/core/reviews/reviews.types.ts`: `FlagPolicy = { schedule: (card: Card, grade: Grade, now: Date) => Card }`.
    - `src/core/reviews/reviews.constants.ts`: `NO_FLAG: FlagPolicy = { schedule: scheduleAfter }`; `FLAG_POLICIES: Record<ReviewFlag, FlagPolicy>` with `'missing-prerequisite': NO_FLAG` and `'badly-written': { schedule: (card) => card }` (a named `KEEP_SCHEDULE`).
    - `src/core/reviews/reviews.ts`: `policyOf(flag: ReviewFlag | null): FlagPolicy` gives `NO_FLAG` for `null`, else `FLAG_POLICIES[flag]`; `gradeCard` computes the saved card with `policyOf(draft.flag ?? null).schedule(card, draft.grade, now)`. Export `policyOf` and `FlagPolicy` from `src/core/reviews/index.ts`.
  - **Run**: quickstart §2, first two commands
- [X] T007 [US2] A card voided today leaves every list until the next local day, in `src/core/sessions/sessions.ts`
  - **Test**:
    - `sessions.test.ts`:
      - `a card with a review voided today leaves the scope and nextDue is at most tomorrow` — `dueReviews(2)`, a review of `due-0` flagged `badly-written` at `today + 1h` → only `due-1` listed; with `due-1` graded too and nothing else due, `nextDue` is `tomorrow`.
      - `a card voided before today is listed` — the same review at `today − 1h` → `due-0` listed.
    - `review-due.test.ts`: `004-US2-AS2 a card voided today is absent from the due list and a topic until the next local day` — two new cards tagged `messaging` (`0123`, `4567`); grade `0123` with `flag: badly-written`. `review due --json` and `review topic messaging --json` → `cards` `['4567']`. With `now` at `2026-11-12T05:00:00.000Z` (the next local day), `review due --json` lists `0123` again.
  - **Code**: `FlagPolicy` gains `hidesUntilTomorrow` (`false` in `NO_FLAG`, `true` for `badly-written`). `sessionList` removes from the scope, beside the held-back cards, every card with a review at or after `today` whose `policyOf(review.flag).hidesUntilTomorrow`; when it removes any, `nextDue` is `earlier(nextDue, tomorrow)`, as for held-back cards.
  - **Run**: quickstart §2, third command
- [ ] T008 [US2] A voided review counts toward the session's cap and not toward the day's new cards, in `src/core/sessions/sessions.ts`
  - **Test**:
    - `sessions.test.ts`: `a voided review of a new card does not count toward the day` — `newPerDay: 1`, a review of `new-0` flagged `badly-written` today with `stateBefore: 'new'`, scope `freshCards(3)` → `new-1` listed, `heldBack: 1`.
    - `review-due.test.ts`: `004-US2-AS3 a voided review counts toward the session's cap and not toward the day's new cards, and its card stays new` — three new cards. `review due --session-size 1 --new-per-day 1 --json` → keep `session`; grade `0123` with `flag: badly-written`. With `--session <session> --session-size 1 --new-per-day 1` → `capReached: true`, `cards: []`. A new session, `review due --session-size 1 --new-per-day 1 --json` → `cards` `['4567']`, `heldBack: 1`. `card show 0123 --json` → `state: new`.
  - **Code**: `FlagPolicy` gains `countsAsIntroduced` (`true` in `NO_FLAG`, `false` for `badly-written`); `introducedSince` keeps only reviews whose `policyOf(review.flag).countsAsIntroduced`. The cap half is green on arrival (a voided review is a review in the session); the day half fails first.
  - **Run**: `pnpm test -t 004-US2-AS3`
- [ ] T009 [US2] `aletheia-review` voids a review whose wording decided the answer, right or wrong, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`: `004-US2-AS4 aletheia-review voids a review whose wording decided the answer, right or wrong, says why, and lets Angelo dispute it`. The text contains `"flag":"badly-written"`, `right or wrong`, `read two ways`, `gives its answer away`, `not today` and `dispute`.
  - **Code**: a section "The wording decided it" (research R9):
    - When the question can be read two ways, lacks context it should carry, asks something other than its key points, or gives its answer away, the wording, not Angelo's memory, decided the answer, right or wrong. Say why in a line with the grade, and record it with `"flag":"badly-written"` (a JSON example) once his reply settles it.
    - The review is voided: the card keeps its schedule and does not come back today; never read its printed `due` as when it comes back.
    - Angelo may dispute a voiding ("no, la pregunta está bien"), or ask for one ("esa pregunta está mal escrita"), as he disputes a grade; his word is final.
  - **Run**: `pnpm test -t 004-US2-AS4`

**Checkpoint**: US2 is complete.

---

## Phase 6: Step 4 — Rewrite in place (US3)

**Goal**: a card's content changes in place, keeping its id, source, schedule and reviews; the
search sees the new text; the skill rewrites only after approval.

**Independent Test**: quickstart §3.

- [ ] T010 [P] [US3] `card edit` changes the fields given and keeps the rest, in `src/core/cards/cards.ts`, `src/shell/db/cards/cards.ts` and `src/shell/cli/commands/card-edit/card-edit.ts`
  - **Test**:
    - `src/shell/db/cards/cards.test.ts`: `update replaces the content and the tags and leaves the schedule` — save `card`, then `update({ ...card, question: 'q2', tags: ['messaging::rabbitmq'], updatedAt: later })` → `find` gives the new question, the one new tag and `updatedAt: later`; `select state, due, reps, last_review, source, created_at from cards` is unchanged.
    - `src/shell/cli/commands/card-edit/card-edit.test.ts`, with card `0123` saved at `T0` and graded Good at `T0`:
      - `004-US3-AS1 card edit changes the fields given and keeps the id, source, schedule and reviews` — at `T1`, `card edit --json` with `{ card: '0123', question: 'En Docker, ¿qué contenedores lista \`docker ps\` y cuáles añade \`docker ps -a\`?', tags: ['docker::commands'] }` → stdout's fields equal `card show 0123 --json`'s before the edit, except `question`, `tags` and `updatedAt` (`T1` as shown); one review in the log; `review topic docker --json` lists `0123`.
      - `004-US3-AS2 card edit refuses a broken rule, nothing to change, a field that cannot change or an unknown card, and changes nothing` — `it.for`: `{ keyPoints: [] }` → `error: invalid edit: keyPoints: must have 1 to 3 items`; `{ tags: ['Docker'] }` → `tags[0]: use a-z, digits and dashes, in segments joined by ::`; `{ type: 'essay' }` → `type: must be concept, comparison, command, scenario or code`; `{ question: ' ' }` → `question: is required`; `{ source: 'x' }` and `{ due: 'x' }` → `<field>: is not an edit field`; `{}` (only `card`) → `error: invalid edit: give a field to change`; `{ card: 'zzzz', question: 'q' }` → `error: card "zzzz" not found`. Each exits 1, and `card show 0123 --json` equals what it gave before.
  - **Code**:
    - `src/core/cards/cards.types.ts`: `CardEdit = { card: string } & Partial<Pick<CardDraft, 'type' | 'question' | 'answer' | 'keyPoints' | 'situation' | 'tags'>>`; `CardRepository` gains `update(card: Card): void`; `EditCardDeps = { repository: CardRepository; now: Date }`.
    - `src/core/cards/cards.ts`: `editCard({ card, ...changes }, { repository, now })` → `cardById`, then `{ ...found, ...changes, updatedAt: now }`, saved with `update` and returned. Export it.
    - `src/shell/db/cards/cards.ts`: `StoreCardRepository.update` updates `type`, `question`, `answer`, `situation`, `key_points` and `updated_at` where `id` matches, deletes the card's `card_tags` rows and inserts its tags, in one transaction; it never writes the schedule columns, `source`, `status` or `created_at`.
    - `src/shell/cli/commands/card-add/card-add.schema.ts`: the six content field schemas move into an exported `cardFields` object; `cardSchema` is `z.strictObject({ ...cardFields, source: requiredText })`.
    - `src/shell/cli/commands/card-edit/`: `card-edit.schema.ts` with `editSchema = z.strictObject({ card: requiredText, ...partial cardFields })`; `card-edit.constants.ts` with `NOT_AN_EDIT_FIELD = 'is not an edit field'` and `NOTHING_TO_CHANGE = 'give a field to change'`; `card-edit.errors.ts` with `InvalidEditError(issues)` (`invalid edit: ` + `fieldMessages`) and `NothingToChangeError`; `card-edit.ts` with `cardEditCommand` (`group: 'card'`, `name: 'edit'`, "change the fields of a card given as JSON on stdin, keeping its schedule") that parses, refuses an edit naming only `card`, calls `editCard` and returns `shownCard(card, context.timeZone)`.
    - `card-show.ts` exports `shownCard` (decision 6). `main.ts` registers `cardEditCommand` after `cardShowCommand`.
  - **Run**: quickstart §3, first command
- [ ] T011 [US3] The search sees an edit at once, in `migrations/<ts>_card_search_on_update/migration.sql`
  - **Test**: `card-edit.test.ts`: `004-US3-AS3 a card edited is found by a word of its new text and no longer by a word only in its old one` — edit `0123`'s question to the one of T010. `card search --json` with `{ words: 'añade' }` → `['0123']`; with `{ words: 'diferencia' }` (only in `SAMPLE_DRAFT`'s old question) → `[]`.
  - **Code**: `pnpm exec drizzle-kit generate --custom --name card_search_on_update`, holding `CREATE TRIGGER card_search_on_update AFTER UPDATE OF question, answer, key_points, situation ON cards BEGIN UPDATE card_search SET question = new.question, answer = new.answer, key_points = new.key_points, situation = new.situation WHERE card_id = new.id; END;`, in the style of `migrations/20261110114907_card_search/migration.sql`.
  - **Run**: quickstart §3, second command
- [ ] T012 [US3] `aletheia-review` proposes a rewrite of the same knowledge and saves it only after approval, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`: `004-US3-AS4 aletheia-review proposes a rewrite of the same knowledge, shows the exact before and after, and runs aletheia card edit only after Angelo approves`. The text contains `aletheia card edit`, `the exact before and after`, `same knowledge`, `only after Angelo approves` and `slice 7`.
  - **Code**: a section "A rewrite" (research R9), and one line in "The wording decided it" pointing to it:
    - After a voided review, or when Angelo asks ("la pregunta de #9p3x se entiende mal"), propose a rewrite only when the card still asks for the same knowledge: a clearer question, a tidier answer or key points of the same meaning, adjusted tags, situation or type. It follows the card rules of `az-aletheia-add`.
    - Show the exact before and after of every field that changes; run `aletheia card edit` (a heredoc example with `card` and the changed fields only) only after Angelo approves, with his edits. It prints the card; read it back in a line. If it exits 1, nothing changed: read the `error:` line, fix the JSON and send it again.
    - When the fix would change what the key points mean, say the card needs replacing, which arrives with slice 7 (prune), and leave it as is.
    - A rewrite does not change the grade being settled; a voided review stays voided.
  - **Run**: `pnpm test -t 004-US3-AS4`

**Checkpoint**: every id of spec 004 has its test; `tests/traceability` is green.

---

## Phase 7: Close

- [ ] T013 Update `CLAUDE.md` and the contract: Commands names `card edit` beside `card add` (JSON on stdin), the `flag` and `prerequisiteOf` fields of `review grade`, and `specs/004-gaps-and-rewrites/contracts/cli.md`; `specs/004-gaps-and-rewrites/contracts/cli.md` gets any message a task changed; quickstart §1 to §3 in `test` through `pnpm aletheia`; `pnpm check` green, traceability included; commit `docs: close slice 4 tasks`
- [ ] T014 Hand off: Angelo merges `004-gaps-and-rewrites` into `main` and runs `pnpm release` from a clean `main` (give him the commands, run neither); the release backs up `prod` before the `reviews` rebuild; then quickstart §4 in `prod`, and the Measures of `specs/004-gaps-and-rewrites/quickstart.md` after two weeks (SC-002, SC-003)

---

## Dependencies & Execution Order

- T001 is done.
- US1: T002 → T003 → T004 → T005.
- US2: T006 needs T002 (the flag). T006 → T007 → T008 → T009.
- US3: T010 needs only T001. T010 → T011. T012 needs T009 (it points from its section) and
  T011.
- T013 needs all; T014 needs T013.

## Parallel Opportunities

- T010 and T011 touch none of the files of US1 and US2 except `main.ts` (one line) and the
  migrations folder (each migration its own folder), so they can run beside T002–T009. Their
  custom migration gets a later timestamp than T002's either way.
- The skill tasks (T005, T009, T012) share `SKILL.md`; run them in order.

## Implementation Strategy

1. **MVP**: Phases 3–4 (US1). After a merge and a release, "no recuerdo qué es X" pulls the
   prerequisite or offers it in `prod`.
2. **Then** Phase 5 (US2) and Phase 6 (US3), each a release Angelo could take on its own. US3
   can move to its own slice if this one outgrows two days (constitution V).
3. Commit after every green task on `004-gaps-and-rewrites`; `pnpm check` before closing each
   task, with the traceability exception of decision 2.
