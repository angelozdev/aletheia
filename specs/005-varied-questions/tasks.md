---

description: "Task list for 005-varied-questions"
---

# Tasks: Varied Questions

**Input**: Design documents from `specs/005-varied-questions/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.6.0, ADRs 0002–0018

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario id they cover (`005-USx-ASy`). Watch them fail, write the minimum code, then
refactor. Tests drive the public interface: `main(argv, context)` through `cliOnTempStore`, the
exported functions of `src/core` and `src/shell/db`, and the skill file on disk.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs, and each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 a card comes back worded differently, US2 a bad rephrasing does not count
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slices 0 to 4's, unchanged:

- Code lives in `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one folder per
  module, with `.test.ts`, `.types.ts`, `.errors.ts`, `.constants.ts` and `.schema.ts` files
  each only when needed (ADR-0007).
- Units import each other through `#core/*` and `#shell/*` (ADR-0004), and only `src/shell/db`
  knows SQLite and Drizzle (ADR-0010).
- Every conventional literal (`'badly-rephrased'`, a message) is a named constant.
- No comments, and no call taking a call taking a call (lint).

Shared by the tests of this slice:

- `review-grade.test.ts`: a temp store per test from `cliOnTempStore`, at its `NOW`
  (`2026-11-09T15:00:00.000Z`), with `SAMPLE_DRAFT` saved as `0123`. `grade(fields)` merges
  into `GRADE`, `gradeWithout(field)` drops one field, and `expectRefused` checks exit 1 with
  nothing recorded. Reviews are read back with `selectAll(cli.db, 'select … from reviews')`.
- `review-due.test.ts`: its `let now` (`2026-11-12T02:00:00.000Z`, so tomorrow starts at
  `2026-11-12T05:00:00.000Z`), `grade(fields)`, `list(argv)` and `idsOf(list)`.
- `src/shell/db/reviews/reviews.test.ts`: `insertReview(overrides)` over `VALID_REVIEW`, the
  `refuses %s` table, and `withStore`.
- An asked question for the fixtures: `ASKED = 'Si corres docker ps y luego docker ps -a, ¿qué contenedores añade el segundo?'`.

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is closed (T001).** Angelo accepted ADR-0018 and the names of research R1 and R2
   (`askedQuestion`, `asked_question`, `badly-rephrased`) on 2026-11-14; design §5 caught up.
2. **The traceability test stays red until T006.** A task closes with every check green except
   `tests/traceability`, and its list of missing ids shrinks by exactly the ids the task names.
3. **The migrated-store test is a guard (T002).** It is green before the first rebuild, and must
   stay green through both rebuilds (T002, T004). It asks for no production code, so it does
   not fail first. The INV-02 trigger tests fail first, as in slice 4.
4. **Fixtures gain `askedQuestion` (research R8).** `REVIEW` and `graded()` gain
   `askedQuestion: null`. The `review grade` JSON in the CLI tests gains `askedQuestion: ASKED`.
   No assertion changes.
5. **The flag message changes with the contract (T004).** The 004-US1-AS2 cases in
   `review-grade.test.ts` expect `flag: must be missing-prerequisite or badly-written`; they
   will expect `flag: must be missing-prerequisite, badly-written or badly-rephrased`. The
   message is built from `REVIEW_FLAGS`, so the contract changes; no test is weakened. The
   titles "outside the two" become "outside the three", here and in `reviews.test.ts`.
6. **The voided-review tests are shared, not copied (jscpd, T004).** The bodies of 004-US2-AS1,
   AS2 and AS3 move into helpers that take the flag. The 004 tests call them with
   `badly-written` and keep their assertions; the 005 tests call them with `badly-rephrased`.
7. **`badly-rephrased` shares one policy object with `badly-written` (research R3).** The
   policy becomes `VOIDED` in `src/core/reviews/reviews.constants.ts`. No call site compares a
   flag with either constant.

---

## Phase 1: Setup (gate)

- [X] T001 Gate: Angelo accepts ADR-0018
  - Mark it `accepted` in `docs/adr/0018-a-review-keeps-the-question-as-asked.md` and `docs/adr/README.md`, with the names of `specs/005-varied-questions/research.md` R1 and R2.
  - Update design §5 in `docs/design/2026-11-08-aletheia-design.md` (research R8):
    - The review log also keeps "the question as Claude asked it (none for reviews before slice 5)".
    - The flag is "`missing-prerequisite`, `badly-written` or `badly-rephrased`".
    - The voided paragraph reads "A review flagged `badly-written` or `badly-rephrased` is **voided**".
  - One commit each.

---

## Phase 2: Foundational

Intentionally empty. Every type, migration and field lands with the first task that needs it.

---

## Phase 3: Step 1 — A card comes back worded differently (US1)

**Goal**: every new review carries the question as asked; the store keeps every review through
the rebuild; the skill asks every question rephrased.

**Independent Test**: quickstart §1.

- [X] T002 [US1] `review grade` requires and records the question as asked, the store refuses a blank one, and migrating keeps every review, in `src/shell/db/reviews/reviews.schema.ts` and `src/shell/cli/commands/review-grade/review-grade.schema.ts`
  - **Test**:
    - `src/shell/db/reviews/reviews.test.ts`:
      - `INV-02 migrating a store keeps every review recorded before, with its flag and its prerequisite` (decision 3):
        - Open a store at its own temp path with `openTestStore(path, migrationsUpTo(LAST_RELEASED_MIGRATION))`, save `card` and `otherCard`, and close it.
        - Insert three reviews with `runSql`: `insertReview()`, `insertReview({ flag: 'badly-written', grade: 'good' })` and `insertReview({ prerequisite_of: 'c4gr' })`. Keep `selectAll(path, 'select * from reviews order by id')`.
        - Open the store with every shipped migration and close it.
        - The same select gives the kept rows, each with `asked_question: null`.
      - `accepts a review with its question as asked`: `insertReview({ asked_question: ASKED })` gives one row.
      - The `refuses %s` table gains `['a blank question as asked', { asked_question: '  ' }]`.
      - `record stores the question as asked`: `record({ ...REVIEW, askedQuestion: ASKED }, …)`. `select asked_question from reviews` gives `ASKED`, and `since(now)` returns it.
      - The two `INV-02` trigger tests stay as they are. They go red after the generated migration and green again after the custom one.
    - `src/shell/cli/commands/review-grade/review-grade.test.ts`:
      - `005-US1-AS1 review grade logs the question as asked and leaves the card's stored question unchanged`: `grade({ askedQuestion: ASKED })` exits 0, `select asked_question from reviews` gives `ASKED`, and `shownCard().question` is `SAMPLE_DRAFT.question`.
      - `005-US1-AS2 review grade refuses %s`, with `it.for` over `['no question as asked', gradeWithout('askedQuestion')]` and `['a blank question as asked', JSON.stringify({ ...GRADE, askedQuestion: '  ' })]`. Each gives `expectRefused(…, line('invalid review: askedQuestion: is required'))`.
  - **Code**:
    - `tests/support/fixture-migrations/`:
      - `LAST_RELEASED_MIGRATION = '20261110202019_card_search_on_update'` in the constants.
      - `migrationsUpTo(name)` copies the folders of `SHIPPED_MIGRATIONS` whose name is at most `name` into a fresh temp dir, and returns it.
    - `src/core/reviews/reviews.types.ts`: `Review` gains `askedQuestion: string | null`, and `ReviewDraft` gains `askedQuestion: string`. `gradeCard` records `askedQuestion: draft.askedQuestion`.
    - `src/shell/db/reviews/reviews.schema.ts`:
      - Add `askedQuestion: text('asked_question')`.
      - Add `check('reviews_asked_question', sql\`${table.askedQuestion} IS NULL OR ${notBlank(table.askedQuestion)}\`)`, which reads "`asked_question IS NULL OR length(trim(asked_question)) > 0`".
    - Migrations:
      - Run `pnpm db:generate --name asked_question`. Read the SQL: it adds the column and rebuilds `reviews` through `__new_reviews`, and its `INSERT` must copy `flag` and `prerequisite_of`.
      - Run `pnpm exec drizzle-kit generate --custom --name reviews_never_change_after_asked_question`. It holds `reviews_never_deleted` and `reviews_never_changed` exactly as in `migrations/20261110005603_reviews_never_change/migration.sql`.
    - `src/shell/db/reviews/reviews.ts`: `reviewRow` and `reviewFrom` carry `askedQuestion`, `null` both ways. `reviews.types.ts` follows.
    - `review-grade.schema.ts`: `askedQuestion: requiredText`, after `rationale`.
    - The fixtures of decision 4: `REVIEW` in `reviews.test.ts`, `graded()` in `src/core/sessions/sessions.test.ts`, `GRADE` in `review-grade.test.ts`, `GOOD` in `card-edit.test.ts`, and `grade()` in `review-due.test.ts` and `review-topic.test.ts`.
  - **Run**: quickstart §1
- [X] T003 [US1] `aletheia-review` asks every question rephrased and records the question as asked, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `tests/skills/review-skill.test.ts`: `005-US1-AS3 aletheia-review asks every question rephrased, with the same key points, and records the question as asked`.
    - The text contains `"askedQuestion"`, `rephrase`, `the same key points`, `names the technology and the variant`, `verbatim`, `no hint`, `earlier in this session`, `pregúntamela como está` and `against the stored key points`. Each phrase stays on one line of `SKILL.md`.
    - The count of `aletheia review grade <<'JSON'` in the text equals the count of `"askedQuestion"` inside those heredocs.
  - **Code**:
    - Section 2, "One question at a time" (research R6):
      - Rephrase every question, so Angelo recalls the concept and does not recognize the sentence. Ask for the same key points, and name the technology and the variant.
      - Keep code, commands and their flags verbatim, and give no hint the stored question does not give.
      - Word it differently from the stored question and from any wording asked earlier in this session, a re-show included.
      - Ask it as stored when no rewording keeps what it asks, or when Angelo asks ("pregúntamela como está"), and rephrase again from the next card.
      - When Angelo does not understand ("¿responde cómo?"), reword it before he answers.
      - Prerequisites and topic cards are rephrased like any other. After a rewrite, start from the new stored question.
    - Section 3: grade against the stored key points, never the rephrased wording, and the full answer shown is the stored one.
    - Section 4, "Settle and record the grade": a bullet for `askedQuestion`, the question exactly as you asked it, the last wording before Angelo answered. Every `review grade` example gains it.
  - **Run**: `pnpm test -t 005-US1-AS3`. The skill calls the installed `aletheia`, so Angelo uses it after the release (quickstart §3).

**Checkpoint**: US1 is complete; after a release every question comes back worded differently.

---

## Phase 4: Step 2 — A bad rephrasing does not count (US2)

**Goal**: a review voided as `badly-rephrased` is logged and schedules nothing, whatever its
grade; its card leaves the lists until tomorrow, costs a place in the session and introduces no
card; the skill tells a bad rephrasing from a badly written card.

**Independent Test**: quickstart §2.

- [X] T004 [P] [US2] `review grade` voids a `badly-rephrased` review of any grade, in `src/core/reviews/reviews.constants.ts`
  - **Test**:
    - `review-grade.test.ts`, with the helper of decision 6:
      - `005-US2-AS1 review grade logs a badly-rephrased review with both grades, the answer, the rationale and the question as asked, and leaves the card's schedule unchanged`, with `it.for(['again', 'good'])`.
      - The case reads `card show 0123 --json` before and grades with `{ grade, claudeGrade: 'hard', flag: 'badly-rephrased', askedQuestion: ASKED }`.
      - The review row has the flag, both grades, the answer, the rationale and `asked_question: ASKED`. `card show` gives the same schedule fields as before, and stdout's `state` and `due` are the old ones.
    - `review-due.test.ts`: `005-US2-AS2 a card voided as badly-rephrased today is absent from the due list and a topic until the next local day, counts toward the session's cap and not toward the day's new cards`. It calls the helpers of decision 6 with `badly-rephrased`, which give the 004-US2-AS2 and AS3 assertions.
    - Decision 5: the 004-US1-AS2 flag cases expect `flag: must be missing-prerequisite, badly-written or badly-rephrased`.
    - `src/shell/db/reviews/reviews.test.ts`: `accepts a badly-rephrased review of any grade`, through `insertReview({ flag: 'badly-rephrased', grade: 'again' })` and `insertReview({ flag: 'badly-rephrased', grade: 'easy' })`, gives two rows. `refuses a flag outside the three` keeps `{ flag: 'trivia' }`. The INV-02 trigger tests go red, then green. The migrated-store test stays green.
  - **Code**:
    - `src/core/reviews/reviews.constants.ts`:
      - `REVIEW_FLAGS = ['missing-prerequisite', 'badly-written', 'badly-rephrased'] as const`, with a `BADLY_REPHRASED` constant.
      - The `badly-written` policy becomes `VOIDED` (`schedule: KEEP_SCHEDULE`, `hidesUntilTomorrow: true`, `countsAsIntroduced: false`), used by both flags in `FLAG_POLICIES`.
    - Migrations:
      - Run `pnpm db:generate --name badly_rephrased`. Read the SQL: `reviews_flag` reads "`flag IS NULL OR flag IN ('missing-prerequisite','badly-written','badly-rephrased')`", `reviews` is rebuilt, and its `INSERT` copies `asked_question`, `flag` and `prerequisite_of`.
      - Run `pnpm exec drizzle-kit generate --custom --name reviews_never_change_after_badly_rephrased`, with the same two triggers.
  - **Run**: quickstart §2
- [X] T005 [US2] `aletheia-review` tells a bad rephrasing from a badly written card, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`: `005-US2-AS3 aletheia-review voids a review its rephrasing decided as badly-rephrased with no rewrite, and one the stored wording would have decided too as badly-written`.
    - The text contains `"flag":"badly-rephrased"`, `only your rephrasing`, `propose no rewrite`, `the stored wording would have decided it too` and `"flag":"badly-written"`.
    - The 004-US2-AS4 phrases stay.
  - **Code**: section "The wording decided it" (research R6):
    - When the wording decided the answer, right or wrong, tell which wording did.
    - If only your rephrasing did, say so in a line ("mi reformulación quitó el `ack`, así que se leía como otra cosa"). Record it with `"flag":"badly-rephrased"` (a JSON example with `askedQuestion`) and propose no rewrite.
    - If the stored wording would have decided it too, record `badly-written` and propose a rewrite, as before.
    - Both flags void the review: the card keeps its schedule and does not come back today.
    - Angelo may dispute either flag, or ask for one ("esa la reformulaste mal"); his word is final.
  - **Run**: `pnpm test -t 005-US2-AS3`

**Checkpoint**: every id of spec 005 has its test; `tests/traceability` is green.

---

## Phase 5: Close

- [ ] T006 Close the slice's docs
  - In `CLAUDE.md` Commands, `review grade` lists its required `askedQuestion` beside the optional `flag` and `prerequisiteOf`, and the contracts list gains `specs/005-varied-questions/contracts/cli.md`.
  - The contract gets any message a task changed.
  - Run quickstart §1 and §2 in `test` through `pnpm aletheia`.
  - `pnpm check` is green, traceability included.
  - Commit `docs: close slice 5 tasks`.
- [ ] T007 Hand off
  - Angelo merges `005-varied-questions` into `main` and runs `pnpm release` from a clean `main`. Give him the commands and run neither.
  - The release backs up `prod` before the two `reviews` rebuilds.
  - Then quickstart §3 in `prod`, and the Measures of `specs/005-varied-questions/quickstart.md` after two weeks (SC-002).

---

## Dependencies & Execution Order

- T001 comes before every other task.
- US1: T002 → T003.
- US2: T004 needs T002, because its rebuild must copy `asked_question` and its tests send `askedQuestion`. T005 needs T003 (the same file, whose examples carry `askedQuestion`) and T004.
- T006 needs all of them, and T007 needs T006.

## Parallel Opportunities

- T003 (the skill file and its test) and T004 (core, store, CLI tests and migrations) share no
  file, so they can run side by side once T002 is green.
- The skill tasks (T003, T005) share `SKILL.md`; run them in order.

## Implementation Strategy

1. **MVP**: Phase 3 (US1). After a merge and a release, every question in `prod` comes back
   worded differently, and its question as asked is logged.
2. **Then** Phase 4 (US2), the one voiding a bad rephrasing without rewriting the card.
3. Commit after every green task on `005-varied-questions`. Run `pnpm check` before closing
   each task, with the traceability exception of decision 2.
