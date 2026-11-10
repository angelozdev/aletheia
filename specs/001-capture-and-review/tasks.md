---

description: "Task list for 001-capture-and-review"
---

# Tasks: Capture and Review

**Input**: Design documents from `specs/001-capture-and-review/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.5.1, ADRs 0001–0013

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario or invariant id they cover (`001-USx-ASy`, `INV-nn`). Watch them fail, write the
minimum code, refactor. Tests drive the public interface: `main(argv, context)` through
`runCli`, the exported functions of `src/core` and `src/shell/db`, `release(deps)`, and the
skill files on disk.

**Organization**: Phases follow the plan's delivery order (vertical slices), not the story
numbering. Each phase ends in something Angelo runs; each task carries the label of the story
it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1 capture, US2 review)
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slice 0's, unchanged: `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one folder per
module with `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`, `<name>.errors.ts`,
`<name>.constants.ts` and `<name>.schema.ts`, each only when needed (ADR-0007); units import
each other through `#core/*` and `#shell/*`, with one `index.ts` per unit (ADR-0004); only
`src/shell/db` knows SQLite and Drizzle (ADR-0010). Every failure a task names by its message is
an error class in its module's `.errors.ts`, built from its data into that exact text, without
the `error: ` prefix the CLI edge adds. No comments in code.

Shared by the CLI tests of this slice, each created by the first task that needs it:

- a temp store per test: `db = join(tempDir('aletheia-cli-'), 'store.sqlite')`, passed as
  `vars: { ALETHEIA_DB: db }` with `migrationsDir: SHIPPED_MIGRATIONS`;
- `timeZone: 'America/Bogota'` and a fixed `clock`, so shown instants are known;
- ids from a counting draw (0, 1, 2, …): the first card of a run is `0123`, then `4567`,
  `89ab`, `cdef`, `ghjk`, `mnpq`;
- the sample card of `contracts/cli.md` (`type: command`, tag `docker::commands`).

## Decisions taken while cutting tasks (Angelo may veto)

1. **ADR acceptance is a gate before T002** (plan, Constitution Check).
2. **The traceability test stays red until T018.** It already scans every spec, and spec 001
   defines 16 ids with no test yet. Until the last one is covered, a task closes with every
   check green except `tests/traceability`, whose list of missing ids must shrink by exactly
   the ids the task names. No test is changed for this. The alternative, teaching the test to
   skip a spec in progress, would weaken it, so it is not taken.
3. **`runCli` defaults to an empty migrations folder (T002).** Slice 0's CLI tests assert an
   exact stderr on a store with nothing pending; with real migrations shipped they would gain
   `migrated:` lines. The default changes in test support only, their assertions stay as they
   are, and the tests of this slice ask for the shipped folder.
4. **One existing assertion changes (T018).** `000-US2-AS1` expects
   `release: <version> installed\n` as the whole stdout; step 5 of the contract adds the skill
   line after it. Only that expected text changes.
5. **Plan tree adjustments**: the Drizzle tables live in `src/shell/db/cards/cards.schema.ts`
   and `src/shell/db/reviews/reviews.schema.ts` (ADR-0007 puts schemas beside their module), so
   there is no `src/shell/db/schema/`; `copySkill` is injected into `release()` as `build` is,
   so the release tests stay on the fake runner and the copy is tested over temp folders; a
   table's `CHECK` constraints are declared and tried with the task that creates the table,
   because an unreleased migration is generated once.
6. **Input is validated inside the store action.** A refused input still prints `env:` (and
   `migrated:` on a fresh store) before its `error:` line; nothing is stored.
7. **001-US2-AS4 is tested twice**: the rule in T011 over a store arranged with SQL, and end to
   end in T012 once a grade can be recorded.
8. **New contract lines**, each added to `contracts/cli.md` by the task that emits it: the
   per-field messages of T004 and T013, `error: no free card id after 5 draws` (T007).

---

## Phase 1: Setup (gate)

**Purpose**: The decisions this slice builds on are accepted. No behavior, so no test (named
exception).

- [X] T001 Gate: once Angelo accepts ADRs 0011–0013, change `**Status:** proposed` to `accepted` in `docs/adr/0011-the-release-copies-the-global-skill.md`, `docs/adr/0012-ts-fsrs-5-with-fsrs-6-and-one-learning-step.md`, `docs/adr/0013-cards-tags-and-reviews-with-rules-in-the-store.md` and in the index of `docs/adr/README.md`; commit `docs(adr): accept 0011-0013`. Do not start T002 before Angelo says so.

---

## Phase 2: Foundational

Intentionally empty. Every dependency, helper, barrel and context field lands with the first
task that needs it.

---

## Phase 3: Step 1 — Save a card and show it (US1) 🎯 first stop

**Goal**: A valid card goes in through `card add` and comes back whole through `card show`.

**Independent Test**: `pnpm aletheia card add <<'JSON' …` prints an id; `pnpm aletheia card
show <id>` prints every field as written, with its dates in local time.

- [X] T002 [US1] `card add` saves a valid card and prints its id, in `src/shell/cli/commands/card-add/card-add.ts` (carries the shared setup: `drizzle-kit`, the `cards` and `card_tags` tables, command groups, stdin, the id draw)
  - **Test**, in this order:
    - `src/core/time/time.test.ts`: `storedInstant writes an instant as UTC ISO text` — `storedInstant(new Date('2026-11-08T21:04:05.123Z'))` → `'2026-11-08T21:04:05.123Z'`.
    - `src/core/cards/cards.test.ts`: `cardId draws four characters of the id alphabet` — the draw is called with bound `32`; draws `19, 7, 20, 2` → `'k7m2'`. `newCard starts a card active and new, due at once` — `newCard(draft, 'k7m2', now)` → the draft's fields plus `id`, `status: 'active'`, `state: 'new'`, `due: now`, `stability: 0`, `difficulty: 0`, `scheduledDays: 0`, `learningSteps: 0`, `reps: 0`, `lapses: 0`, `lastReview: null`, `createdAt: now`, `updatedAt: now`.
    - `src/shell/db/cards/cards.test.ts`, over a temp store opened with `openTestStore(path)` (shipped migrations): `saveAll stores a card and its tags` (rows read back with `selectAll`), then one test per rule of data-model.md, each a `runSql` insert that must throw while a valid insert passes: a type outside `concept`, `comparison`, `command`, `scenario`, `code`; a status outside `active`, `archived`; a state outside `new`, `learning`, `review`, `relearning`; a blank (`'  '`) question, answer, situation or source; `key_points` of `'[]'`, of four items, of `'{}'`; an id that is not 4 characters of `0-9a-hjkmnp-tv-z` (`'K7M2'`, `'k7m'`, `'k7mi'`, `'k7m2x'`); a tag `'mensajería'`, `'Docker'` or `''`; the same tag twice on a card; a tag for a card that does not exist.
    - `src/shell/cli/commands/card-add/card-add.test.ts`: `001-US1-AS1 card add stores a valid card active and new, due now, and prints its id` — stdin is the contract's list of one card; exit 0; stdout `ids[1]: "0123"\n` (TOON quotes a string that reads as a number); stderr starts with `env: custom (<db>)\n`; `select id, status, state, due, created_at, updated_at from cards` → one row `0123`, `active`, `new`, and the three instants equal to `FIXED_INSTANT`; `select tag from card_tags` → `docker::commands`. A second test: `--json` prints `{"ids":["0123"]}`.
  - **Code**:
    - `pnpm add -D drizzle-kit@1.0.0-rc.5`; `drizzle.config.ts` at the root (`dialect: 'sqlite'`, `schema: './src/shell/db/**/*.schema.ts'`, `out: './migrations'`); script `"db:generate": "drizzle-kit generate"` in `package.json`.
    - `src/shell/db/cards/cards.schema.ts`, exactly data-model.md: `cards` with `id` text primary key `CHECK (length(id) = 4 AND id NOT GLOB '*[^0-9a-hjkmnp-tv-z]*')`; `type` `CHECK (type IN ('concept','comparison','command','scenario','code'))`; `question`, `answer`, `situation`, `source` text not null, each `CHECK (length(trim(<column>)) > 0)`; `key_points` text not null `CHECK (json_valid(key_points) AND json_array_length(key_points) BETWEEN 1 AND 3)`; `status` text not null default `'active'` `CHECK (status IN ('active','archived'))`; `due` text not null; `state` text not null default `'new'` `CHECK (state IN ('new','learning','review','relearning'))`; `stability`, `difficulty` real not null default 0; `scheduled_days`, `learning_steps`, `reps`, `lapses` integer not null default 0; `last_review` text nullable; `created_at`, `updated_at` text not null. `card_tags` with `card_id` text not null references `cards(id)`, `tag` text not null `CHECK (length(tag) > 0 AND tag NOT GLOB '*[^a-z0-9:-]*')`, primary key `(card_id, tag)`.
    - `pnpm db:generate --name cards`; read `migrations/<timestamp>_cards/migration.sql` against data-model.md and commit the folder with its `snapshot.json`.
    - `src/core/time/` (`index.ts`, `time.ts`): `storedInstant(instant: Date): string`.
    - `src/core/cards/` (`index.ts`, `cards.ts`, `cards.types.ts`, `cards.constants.ts`): types `CardType`, `CardState`, `CardStatus`, `CardDraft` (`type`, `question`, `answer`, `keyPoints`, `situation`, `tags`, `source`), `Card`, and the port `CardRepository` with `saveAll(cards: Card[]): void`; constants `CARD_TYPES`, `ID_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz'`, `ID_LENGTH = 4`; `cardId(randomIndex)`, `newCard(draft, id, now)`, `addCards(drafts, { repository, randomIndex, now }): string[]`.
    - `src/shell/db/cards/cards.ts`: `cardRepository(store: Store): CardRepository`; `saveAll` writes every card and its tags in one transaction, instants through `storedInstant`, key points as JSON. Export it from `src/shell/db/index.ts`.
    - `src/shell/cli/main/main.types.ts`: `CliContext` gains `stdin: () => Promise<string>` and `randomIndex: (bound: number) => number`; `CliCommand` gains an optional `group` and `run(context, options, args: string[])`. `src/shell/cli/main/main.ts` registers a grouped command under its group (`card`: "cards of the deck"). `src/shell/cli/invocation/context/context.ts` passes `randomIndex` from `randomInt` of `node:crypto`. `src/shell/cli/invocation/stdin/stdin.ts`: `readJson(context): Promise<unknown>` and `processStdin()`, which gives `''` when stdin is a terminal and its whole text otherwise; `src/shell/cli/bin/bin.ts` and `src/shell/cli/released.ts` pass it as `stdin`.
    - `src/shell/cli/commands/card-add/card-add.ts`: `cardAddCommand` (`group: 'card'`, `name: 'add'`, "save the cards given as JSON on stdin, all or none"), which reads the list inside `withStore` and returns `{ ids }`; `card-add.schema.ts` holds a zod schema with the shape only (its rules arrive in T004).
    - `tests/support/run-cli/run-cli.ts`: defaults `stdin: () => Promise.resolve('')`, a counting `randomIndex`, and `migrationsDir` from a new `noMigrations()` in `tests/support/fixture-migrations/fixture-migrations.ts` (an empty `tempDir`), per decision 3.
  - **Run**: `pnpm aletheia card add <<'JSON' … JSON` with the card of quickstart §1 → `ids[1]: <id>`
- [X] T003 [US1] `card show <id>` prints every field with its dates in local time, in `src/shell/cli/commands/card-show/card-show.ts`
  - **Test**:
    - `src/core/time/time.test.ts`: `shownInstant writes an instant in a zone's local time with its offset` — `2026-11-12T02:00:00.000Z` → `2026-11-11T21:00:00-05:00` in `America/Bogota` and `2026-11-12T03:00:00+01:00` in `Europe/Madrid`; `instantFrom reads a stored instant back` — `instantFrom('2026-11-12T02:00:00.000Z').getTime()` equals the original.
    - `tests/lint/lint.test.ts`: `fails when a file outside src/core/time imports date-fns` (a `src/core/sample/sample.ts` and a `src/shell/db/sample/sample.ts`, for `date-fns` and for `@date-fns/tz`) and `passes when src/core/time imports date-fns`.
    - `src/shell/cli/commands/card-show/card-show.test.ts`, clock `2026-11-09T15:00:00.000Z`: `001-US1-AS5 card show prints every field and when the card is due, in local time` — after adding the contract's card, `card show 0123` prints exactly the block of `contracts/cli.md` with id `0123`. `001-US1-AS5 card show with an unknown id exits 1 naming it` — stderr ends with `error: card "zzzz" not found\n`, stdout empty. `001-US1-AS4 a card with accents, backticks and multi-line code reads back exactly as written` — a `code` card whose question holds a fenced snippet of several lines with backticks, tabs, double and single quotes, `ñ` and accents; every field of `card show 0123 --json` deep-equals what was sent.
  - **Code**: `pnpm add -D date-fns@4.4.0 @date-fns/tz@1.5.0`. `src/core/time/time.ts`: `instantFrom(stored: string): Date` (`parseISO`) and `shownInstant(instant: Date, timeZone: string): string` (`formatISO` over a `TZDate`). `.oxlintrc.json`: a `no-restricted-imports` pattern group `["date-fns", "date-fns/*", "@date-fns/*"]`, "only src/core/time knows the date library", in the root rule and in every override that restates the rule (the `src/shell/db/**` override stops being `off` and keeps only this group), plus an override for `src/core/time/**` after `src/core/**` that restates core's groups without it. `CliContext` gains `timeZone: string`, set in `context.ts` from `Intl.DateTimeFormat().resolvedOptions().timeZone` and to `'America/Bogota'` in `runCli`. `CardRepository` gains `find(id: string): Card | null`; `src/core/cards/cards.errors.ts`: `CardNotFoundError` → `card "<id>" not found`; `cardById(repository, id)` in `cards.ts`. `main.ts` passes a command's arguments. `cardShowCommand` (`group: 'card'`, `name: 'show'`, argument `<id>`, "print every field of a card") returns the keys of the contract in its order: `id`, `type`, `tags`, `question`, `answer`, `keyPoints`, `situation`, `source`, `status`, `state`, `due`, `lastReview`, `stability`, `difficulty`, `scheduledDays`, `learningSteps`, `reps`, `lapses`, `createdAt`, `updatedAt`, instants through `shownInstant` and `lastReview: null` while new.
  - **Run**: `pnpm aletheia card show <id>`

**Checkpoint**: a card can be captured and read back from the terminal.

---

## Phase 4: Step 2 — Refuse a bad card (US1)

**Goal**: Nothing that breaks a rule of the spec reaches the store, and nothing leaves it.

**Independent Test**: the refusals of quickstart §1, each with exit 1 and no card stored;
`pnpm test -t INV-02`.

- [ ] T004 [US1] `card add` refuses an invalid card naming it and each invalid field, in `src/shell/cli/commands/card-add/card-add.schema.ts`
  - **Test**: `card-add.test.ts`, one case per row; each exits 1, prints nothing on stdout, ends stderr with `error: card 1: <message>\n` and leaves `select count(*) from cards` at 0. `001-US1-AS2 card add refuses …`: no `situation` → `situation: is required`; `answer: "  "` → `answer: is required`; `keyPoints: []` and four key points → `keyPoints: must have 1 to 3 items`; a blank second key point → `keyPoints[1]: is required`; `type: "cloze"` → `type: must be concept, comparison, command, scenario or code`; `tags: []` → `tags: must have at least one tag`; a tag `Docker`, `mensajería`, `docker:commands`, `docker::` or `-docker` → `tags[0]: use a-z, digits and dashes, in segments joined by ::`; the same tag twice → `tags[1]: is repeated`; a field `keypoints` → `keypoints: is not a card field`; no `situation` and four key points together → both messages joined by `; `, in the order of the contract's field table.
  - **Code**: the zod schema gains the rules of the contract's table and the tag grammar `^[a-z0-9]+(-[a-z0-9]+)*(::[a-z0-9]+(-[a-z0-9]+)*)*$` (constant `TAG_PATTERN` in `src/core/cards/cards.constants.ts`, with `MIN_KEY_POINTS = 1`, `MAX_KEY_POINTS = 3`); `card-add.errors.ts`: `InvalidCardsError`, built from the zod issues into `card <n>: <field>: <message>; …`. Add the messages to `contracts/cli.md`.
  - **Run**: quickstart §1, the refusals
- [ ] T005 [US1] Several cards with one invalid store none, in `src/shell/cli/commands/card-add/card-add.errors.ts`
  - **Test**: `card-add.test.ts`: `001-US1-AS3 one invalid card among several stores none` — three cards, the second without `situation` → exit 1, `error: card 2: situation: is required`, 0 rows; the first and the third invalid → `card 1: … | card 3: …`. `src/shell/db/cards/cards.test.ts`: `001-US1-AS3 saveAll stores every card or none` — a list whose second card the store refuses (a type cast to `'cloze'`) throws and leaves 0 rows.
  - **Code**: `InvalidCardsError` names each invalid card by its position from 1, cards joined by ` | `. The transaction of T002 already holds the store half; fix it if the test shows otherwise.
  - **Run**: `pnpm aletheia card add` with two cards, one without `situation`
- [ ] T006 [US1] Malformed JSON on stdin exits 1 with nothing stored, in `src/shell/cli/invocation/stdin/stdin.ts`
  - **Test**: `card-add.test.ts`: `card add refuses malformed JSON` — stdin `not json` → exit 1, stderr holds a line starting `error: invalid JSON on stdin: `, 0 rows; `card add refuses an empty stdin` → the same line; `card add refuses anything but a list of cards` — `{}` and `[]` → `error: expected a list of one or more cards`.
  - **Code**: `src/shell/cli/invocation/stdin/stdin.errors.ts`: `InvalidJsonError` → `invalid JSON on stdin: <reason>`, thrown by `readJson`; `ExpectedCardListError` in `card-add.errors.ts`.
  - **Run**: `echo 'not json' | pnpm aletheia card add; echo $?` → `1`
- [ ] T007 [US1] An id that is taken is drawn again, in `src/core/cards/cards.ts`
  - **Test**: `src/shell/db/cards/cards.test.ts`: `saveAll refuses an id that is taken and stores none` → throws `CardIdTakenError`. `src/core/cards/cards.test.ts`: `addCards draws again when an id is taken` (a fake repository that refuses the first list) and `addCards gives up after five draws` → `NoFreeCardIdError`, `no free card id after 5 draws`. `card-add.test.ts`: `a second card add with the same draws gets another id` — two runs on one store print `ids[1]: "0123"` and `ids[1]: "4567"`.
  - **Code**: `CardIdTakenError` and `NoFreeCardIdError` in `src/core/cards/cards.errors.ts`, `MAX_ID_DRAWS = 5` in `cards.constants.ts`; the repository turns the store's primary-key refusal into `CardIdTakenError`; `addCards` redraws every id of the list and tries again. Add the error line to `contracts/cli.md`.
  - **Run**: `pnpm aletheia card add` twice; two different ids
- [ ] T008 [US1] The store refuses to delete a card, in `migrations/<timestamp>_cards_never_deleted/migration.sql`
  - **Test**: `src/shell/db/cards/cards.test.ts`: `INV-02 the store refuses to delete a card` — after `saveAll`, `runSql(path, 'delete from cards')` throws `cards are never deleted` and the row is still there; an `update cards set due = …` passes.
  - **Code**: `pnpm exec drizzle-kit generate --custom --name cards_never_deleted`; write `CREATE TRIGGER cards_never_deleted BEFORE DELETE ON cards BEGIN SELECT RAISE(ABORT, 'cards are never deleted'); END;` and commit the folder.
  - **Run**: `pnpm test -t INV-02`

**Checkpoint**: capture by CLI is complete: 001-US1-AS1 to AS5.

---

## Phase 5: Step 3 — Ask what is due (US2)

**Goal**: `review due` answers what Angelo studies now, in order, by his local day.

**Independent Test**: `pnpm aletheia review due` lists the cards saved in step 1 with their
count; on an empty store it prints `count: 0` and `nextDue: null`.

- [ ] T009 [US2] `review due` lists new and due cards, studied first, with their count, in `src/shell/cli/commands/review-due/review-due.ts`
  - **Test**:
    - `src/core/time/time.test.ts`: `startOfTomorrow gives where the local day ends` — `2026-11-12T02:00:00.000Z` in `America/Bogota` → `2026-11-12T05:00:00.000Z`; `2026-03-29T00:30:00.000Z` in `Europe/Madrid`, the night its clock changes → `2026-03-29T22:00:00.000Z`, local midnight in the new offset.
    - `src/core/reviews/reviews.test.ts`: `dueList puts learning cards whose instant passed first, then review cards due before tomorrow, then new cards` — each group ordered as data-model.md says (earliest `due` first; new cards by `createdAt`, then `id`); a review card due exactly at `tomorrow` and a learning card due in a minute are left out.
    - `src/shell/cli/commands/review-due/review-due.test.ts`, clock `2026-11-12T02:00:00.000Z` (9 pm on the 11th in Bogotá): `001-US2-AS1 review due lists new and due cards, studied first, with their count` — six cards added in one run, then arranged with `runSql`: `0123` and `4567` stay new; `89ab` is `review`, due `2026-11-11T15:00:00.000Z`; `cdef` is `review`, due `2026-11-12T04:59:59.000Z` (still today in Bogotá, tomorrow in UTC); `ghjk` is `review`, due `2026-11-12T05:00:00.000Z` (local tomorrow); `mnpq` is `learning`, due `2026-11-12T01:50:00.000Z`. `review due --json` → `count: 5`, ids in the order `mnpq`, `89ab`, `cdef`, `0123`, `4567`, and each item holds exactly `id`, `type`, `tags`, `question`, `keyPoints`, `answer`. A second test compares the TOON of one new card with the block of `contracts/cli.md`.
  - **Code**: `startOfTomorrow(now, timeZone)` in `src/core/time/time.ts`. `src/core/reviews/` (`index.ts`, `reviews.ts`, `reviews.types.ts`): `DueList` (`cards`, `nextDue`) and `dueList(cards: Card[], now: Date, tomorrow: Date): DueList`. `CardRepository` gains `active(): Card[]`. `reviewDueCommand` (`group: 'review'`, "what is due and its grades"; `name: 'due'`, "list the cards due now, studied first") returns `{ count, nextDue, cards }`.
  - **Run**: `pnpm aletheia review due`
- [ ] T010 [US2] With nothing due, `review due` is empty and names the next due instant, in `src/core/reviews/reviews.ts`
  - **Test**: `reviews.test.ts`: `dueList names the earliest instant among the cards left out` and `dueList names none on an empty deck`. `review-due.test.ts`: `001-US2-AS5 with nothing due, review due is empty and names when the next card is due` — one `review` card due `2026-11-13T15:00:00.000Z` → stdout exactly `count: 0\nnextDue: "2026-11-13T10:00:00-05:00"\ncards: []\n`; an empty store → `nextDue: null`.
  - **Code**: `nextDue` in `dueList`, shown through `shownInstant`.
  - **Run**: `pnpm aletheia review due` on a store with nothing due
- [ ] T011 [US2] A step that ends within 20 minutes is due when nothing else is, in `src/core/reviews/reviews.ts`
  - **Test**: `time.test.ts`: `minutesAfter adds minutes to an instant`. `reviews.test.ts`: `a learning card due within 20 minutes joins the list when nothing else is due`; `it stays out while another card is due`; `it stays out when its step ends in 21 minutes`; the same three for `relearning`. `review-due.test.ts`: `001-US2-AS4 a card whose step ends within 20 minutes is due when nothing else is` — one card arranged as `learning`, due 10 minutes after the clock → `count: 1`; with a new card beside it → only the new card.
  - **Code**: `LEARN_AHEAD_MINUTES = 20` in `src/core/reviews/reviews.constants.ts`; `minutesAfter(instant, minutes)` in `src/core/time/time.ts`; the fourth rule of data-model.md in `dueList`.
  - **Run**: quickstart §2 from T012 on

**Checkpoint**: the due list answers 001-US2-AS1, AS4 and AS5.

---

## Phase 6: Step 4 — Grade a card (US2)

**Goal**: A grade is recorded once, with what cannot be rebuilt later, and FSRS decides when
the card comes back.

**Independent Test**: quickstart §2: grade `again`, see the card back in `review due`; grade
`good`, see `count: 0` and `nextDue` tomorrow.

- [ ] T012 [US2] `review grade` records a grade and reschedules the card, in `src/shell/cli/commands/review-grade/review-grade.ts`
  - **Test**:
    - `tests/lint/lint.test.ts`: `fails when a file outside src/core/scheduling imports ts-fsrs` and `passes when src/core/scheduling imports ts-fsrs`.
    - `src/core/scheduling/scheduling.test.ts`, `now = 2026-11-09T15:00:00.000Z`: `001-US2-AS8 a new card graded Good is due on a later day` → `state: 'review'`, `due` two days later, `reps: 1`, `lastReview: now`; `001-US2-AS8 a new card graded Again or Hard comes back within 20 minutes` → `learning`, 10 and 15 minutes later; `001-US2-AS8 a Good after that step moves the card to a later day` → `review`, one day later; `001-US2-AS3 four copies of a card graded differently come back Again first and Easy last` for a new card (10 min, 15 min, 2 days, 8 days) and for a `review` card (strictly increasing `due`, Again as `relearning` 10 minutes later); `a card read back from the store schedules like the original` (every instant through `storedInstant` and `instantFrom`).
    - `src/shell/db/reviews/reviews.test.ts`: `record stores the review and the card's new schedule together`; one `runSql` insert that must throw per rule: a grade or `claude_grade` outside `again`, `hard`, `good`, `easy`; a `state_before` outside the four states; a blank answer or rationale; a review for a card that does not exist. `record changes nothing when the store refuses the review` (a grade cast to `'perfect'`: no review row, the card row unchanged).
    - `src/shell/cli/commands/review-grade/review-grade.test.ts`, clock `2026-11-09T15:00:00.000Z`: `001-US2-AS2 review grade logs the review with its instant and the state before, and prints the next due instant` — the contract's object with `grade: good`, `claudeGrade: good` → stdout exactly `card: 0123\ngrade: good\nstate: review\ndue: "2026-11-11T10:00:00-05:00"\n`; `select card_id, grade, claude_grade, state_before, reviewed_at, answer, rationale from reviews` → one row with `good`, `good`, `new`, `2026-11-09T15:00:00.000Z` and both texts; the card row has `state` `review`, `due` `2026-11-11T15:00:00.000Z`, `reps` 1. `a dispute keeps both grades` — `grade: easy`, `claudeGrade: good` → the row holds `easy` and `good`. `an early review is recorded` — a `review` card due in five days is graded and its `due` moves. `001-US2-AS4 a card graded Again is due again while nothing else is` — grade `again`, then `review due` → `count: 1` with that card; grade `good` 10 minutes later → `count: 0` and `nextDue` the next day.
  - **Code**: `pnpm add -D ts-fsrs@5.4.2`. `src/core/scheduling/` (`index.ts`, `scheduling.ts`, `scheduling.types.ts`, `scheduling.constants.ts`): `Grade`, `GRADES`, `LEARNING_STEPS = ['10m']`, and `scheduleAfter(card: Card, grade: Grade, now: Date): Card` over `fsrs(generatorParameters({ learning_steps: LEARNING_STEPS }))`, mapping `state` and `grade` to the library's numbers and back, `lastReview: null` to no `last_review`, and `elapsed_days: 0`. `.oxlintrc.json`: the group `["ts-fsrs"]`, "only src/core/scheduling knows the scheduler", confined as `date-fns` was in T003. `src/shell/db/reviews/reviews.schema.ts`, exactly data-model.md: `reviews` with `id` integer primary key; `card_id` text not null references `cards(id)`; `grade` and `claude_grade` text not null, each `CHECK (<column> IN ('again','hard','good','easy'))`; `state_before` text not null `CHECK (state_before IN ('new','learning','review','relearning'))`; `reviewed_at` text not null; `answer`, `rationale` text not null, each `CHECK (length(trim(<column>)) > 0)`; then `pnpm db:generate --name reviews`, read and commit. `src/core/reviews/`: `Review`, `ReviewDraft` (`card`, `grade`, `claudeGrade`, `answer`, `rationale`), the port `ReviewRepository` with `record(review: Review, card: Card): void`, and `gradeCard(draft, { cards, reviews, now }): Card`, which finds the card, schedules it and records the review with `stateBefore` set to the state it found. `src/shell/db/reviews/reviews.ts`: `reviewRepository(store)`; `record` inserts the review and updates the card's schedule in one transaction; export it from `src/shell/db/index.ts`. `reviewGradeCommand` (`group: 'review'`, `name: 'grade'`, "record a grade given as JSON on stdin and reschedule its card") with a shape-only zod schema in `review-grade.schema.ts`, returning `{ card, grade, state, due }`.
  - **Run**: quickstart §2
- [ ] T013 [US2] `review grade` refuses an unknown card, a grade outside the four and a missing answer or rationale, in `src/shell/cli/commands/review-grade/review-grade.schema.ts`
  - **Test**: `review-grade.test.ts`, each case exits 1 with an empty stdout, `select count(*) from reviews` at 0 and the card row equal to what it was: `001-US2-AS6 review grade refuses an unknown card` → `error: card "zzzz" not found`; `001-US2-AS6 review grade refuses a grade outside the four` → `error: invalid review: grade: must be again, hard, good or easy` (and `claudeGrade: must be again, hard, good or easy`); `001-US2-AS6 review grade refuses a missing answer or rationale` → `answer: is required`, `rationale: is required`, a blank one included, both joined by `; ` when both fail; a field `note` → `note: is not a review field`; `not json` → the line of T006.
  - **Code**: the rules of the contract's table in the zod schema; `InvalidReviewError` in `review-grade.errors.ts` → `invalid review: <field>: <message>; …`. Add the messages to `contracts/cli.md`.
  - **Run**: `pnpm aletheia review grade` with `"grade": "perfect"`; exit 1
- [ ] T014 [US2] The store refuses to delete or change a review, in `migrations/<timestamp>_reviews_never_change/migration.sql`
  - **Test**: `src/shell/db/reviews/reviews.test.ts`: `INV-02 the store refuses to delete a review` → `reviews are never deleted`; `INV-02 the store refuses to change a review` — `update reviews set grade = 'again'` → `reviews are never changed`; the row reads back as recorded.
  - **Code**: `pnpm exec drizzle-kit generate --custom --name reviews_never_change`, with a `BEFORE DELETE` and a `BEFORE UPDATE` trigger on `reviews`, each `SELECT RAISE(ABORT, '<message>')`.
  - **Run**: `pnpm test -t INV-02`

**Checkpoint**: review by CLI is complete: 001-US2-AS1 to AS6 and AS8.

---

## Phase 7: Step 5 — The two skills (US1, US2)

**Goal**: Angelo talks; Claude drafts, grades and runs the CLI. Judgment lives here and is
checked by use (SC-001); the tests check what a file can show.

**Independent Test**: `pnpm test -t 001-US1-AS6` and `pnpm test -t 001-US2-AS7`. Exception:
both skills call the installed `aletheia`, so Angelo exercises them for real in T020.

- [ ] T015 [P] [US1] The `az-aletheia-add` skill, in `skills/az-aletheia-add/SKILL.md`
  - **Test**: `tests/skills/add-skill.test.ts`: `001-US1-AS6 az-aletheia-add carries its Spanish triggers and calls the installed aletheia` — the frontmatter has `name: az-aletheia-add` and a `description` containing `guarda esto`, `haz una tarjeta` and `añade esto a aletheia`; the file contains `aletheia card add` and none of `pnpm aletheia`, `--env`, `ALETHEIA_DB`, `.sqlite`.
  - **Code**: the skill, in English, telling Claude to answer Angelo in Spanish. It drafts cards from the conversation by the five types of design §7, with their shape and one example each; a question that stands alone, an answer of one to three lines, 1 to 3 key points, a credible situation, tags in English by the grammar of data-model.md, and the source (the repo's name or the study context). It shows every draft with its type, tags, question, answer, key points and situation; Angelo approves, edits or rejects each one; only the approved ones go, in one `aletheia card add <<'JSON' … JSON`, and their ids are reported as `#<id>`. A refusal is read, the draft fixed and shown again. `aletheia card show <id>`, without `#`, answers any question about a card. It never opens a store.
  - **Run**: `pnpm test -t 001-US1-AS6`
- [ ] T016 [P] [US2] The `aletheia-review` skill, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `tests/skills/review-skill.test.ts`: `001-US2-AS7 aletheia-review carries its Spanish triggers and calls the installed aletheia` — `name: aletheia-review`; a `description` containing `repasemos`, `vamos a repasar` and `¿qué tengo para hoy?`; the file contains `aletheia review due` and `aletheia review grade`, and none of `pnpm aletheia`, `--env`, `ALETHEIA_DB`, `.sqlite`.
  - **Code**: the skill, in English, with Spanish output, following FR-007: ask `aletheia review due`; show one question at a time, never with its answer or key points; grade Angelo's answer Again, Hard, Good or Easy by design §8.2 against the card's key points and the rule of its type (§7), with no number; show the grade, the reason and the full answer, then stop and wait, after every grade; a dispute settles Angelo's final grade; record it with `aletheia review grade`, `claudeGrade` being the grade first given; then answer his doubts about that card in two or three lines each, no lesson, no change of grade; the next question only when he says so; ask `review due` again when the list runs out, until `count: 0`, and read `nextDue` as printed. Any question about a card or what is due is answered by running `aletheia`.
  - **Run**: `pnpm test -t 001-US2-AS7`

---

## Phase 8: Step 6 — The release copies the global skill (US1)

**Goal**: One command moves the CLI and the skill that calls it together.

**Independent Test**: `pnpm test -t 001-US1-AS7`; the real copy happens in T020.

- [ ] T017 [P] [US1] The skill folder is copied whole or not at all, in `src/shell/release/skill-copy/skill-copy.ts`
  - **Test**: `src/shell/release/skill-copy/skill-copy.test.ts`, over `tempDir` folders: `001-US1-AS7 copySkill replaces the previous copy with the source folder` — a previous copy holding a stale file; afterwards the destination holds exactly the source's files, no `.partial` folder is left, and the destination path is returned; `it creates the skills folder on a first release`; `it replaces a partial folder left by an earlier failure`; `001-US1-AS7 a copy that fails leaves the previous copy whole` — a source that does not exist throws `SkillCopyFailedError`, `release: failed: cannot copy the skill to <folder>: <reason>`, with the previous copy untouched and no `.partial` left.
  - **Code**: `copySkill({ source, skillsDir }): string` with `cpSync`, `rmSync` and `renameSync`: copy to `<skillsDir>/az-aletheia-add.partial`, remove the previous `<skillsDir>/az-aletheia-add`, rename the partial into place. `skill-copy.constants.ts` (`SKILL_NAME`, `PARTIAL_SUFFIX`), `skill-copy.errors.ts` (`SkillCopyFailedError`, a `ReleaseError`).
  - **Run**: `pnpm test -t 001-US1-AS7`
- [ ] T018 [US1] `pnpm release` copies the skill after installing, and refuses without a place to copy it, in `src/shell/release/release/release.ts`
  - **Test**: `src/shell/release/release/release.test.ts`, with a fake `copySkill` that returns `/s/az-aletheia-add`: `001-US1-AS7 release copies the skill after the install check and names its folder` — it is called once, after the `aletheia --version` call, and stdout is `release: 0.0.0 (2033257) installed\nrelease: skill az-aletheia-add copied to /s/az-aletheia-add\n`; `001-US1-AS7 a release refused or failed before installing never copies the skill` — off `main`, a red check, a failed smoke run and a PATH mismatch leave it uncalled; `001-US1-AS7 a failed copy exits 1 with its message` — the fake throws `SkillCopyFailedError` → exit 1 and that line on stderr; `INV-01 release refuses before its first step with no skill copier` — `copySkill: null` → exit 1, stderr `release: refused: skill copies are disabled here (under vitest)\n`, no command run. The helper `releaseWith` gains the fake, and `000-US2-AS1` expects the second stdout line (decision 4).
  - **Code**: `ReleaseDeps` gains `copySkill: (() => string) | null` in `release.types.ts`; `SkillCopiesDisabledError` in `release.errors.ts`; `release()` refuses first when it is null, and copies and prints after `install`. `src/shell/release/bin/bin.ts` passes `null` under `VITEST`, otherwise `() => copySkill({ source: join(REPO_ROOT, 'skills', 'az-aletheia-add'), skillsDir: join(homedir(), RELEASE_DATA_FOLDER, 'skills') })`, with `RELEASE_DATA_FOLDER` exported from `src/shell/cli/index.ts`.
  - **Run**: `pnpm check`, green for the first time in this slice: the traceability list is empty

**Checkpoint**: every scenario of spec 001 and INV-02 has its test.

---

## Phase 9: Close

**Purpose**: The slice reaches `prod` and Angelo uses it. Documentation and a release, so no
new behavior (named exception).

- [ ] T019 Update `CLAUDE.md` at the repo root for what slice 1 added: the four commands under Commands; under Code, that only `src/core/time` imports `date-fns` and only `src/core/scheduling` imports `ts-fsrs`, that instants are stored in UTC and shown in local time, and that tags are English; under Workflow, where the two skills live and that `skills/az-aletheia-add/` reaches Claude only through a release. Walk quickstart §1 to §3 with `pnpm aletheia`; `pnpm check` green.
- [ ] T020 Hand Angelo the close, in this order, and fill the Measures table of `specs/001-capture-and-review/quickstart.md` with what he reports: merge the branch into `main`; `pnpm release` (his to run); `ln -s ~/.aletheia/skills/az-aletheia-add ~/.claude/skills/az-aletheia-add` (once); quickstart §4 and §5. SC-003 is measured from the sources on a temp store of 1,000 generated cards (`ALETHEIA_DB=<temp file> pnpm aletheia …`), never in `prod`.

---

## Dependencies & Execution Order

- **T001** gates everything.
- **Step 1 (T002–T003)** creates the store, the groups and stdin that every later task uses.
- **Step 2 (T004–T008)** depends on T002; T004 → T005 share the error class; T006, T007 and
  T008 are independent of each other but touch `card-add.test.ts` or `cards.test.ts`, so they
  run in order.
- **Step 3 (T009–T011)** depends on T003 (`src/core/time`, the shown instants).
- **Step 4 (T012–T014)** depends on step 3; T013 and T014 depend on T012.
- **Step 5 (T015, T016)** depends on the contract only; the skills name commands that exist
  from T012.
- **Step 6 (T017, T018)**: T017 is independent; T018 needs T017 and T015 (the folder it copies).
- **Close (T019, T020)** after everything.

US2 cannot be exercised without a card, so it follows US1's first two steps; within the slice
both stories are P1 and ship together (Constitution I).

### Parallel Opportunities

T015, T016 and T017 touch different files and depend on nothing unfinished:

```text
Task: "T015 The az-aletheia-add skill, in skills/az-aletheia-add/SKILL.md"
Task: "T016 The aletheia-review skill, in .claude/skills/aletheia-review/SKILL.md"
Task: "T017 The skill folder is copied whole or not at all, in src/shell/release/skill-copy/skill-copy.ts"
```

Everything else is sequential: one task at a time, test first.

---

## Implementation Strategy

1. T001, the gate.
2. Steps 1 and 2: capture works from the terminal. Stop and try quickstart §1.
3. Steps 3 and 4: review works from the terminal. Stop and try quickstart §2.
4. Steps 5 and 6: the skills and their way to `prod`, checked by tests.
5. Close: release, link, and the first real card captured and reviewed (SC-001).

There is no smaller release than the whole slice: capture without review is not daily use.
The first stop worth showing Angelo is the end of step 1.

## Notes

- One task at a time. Commit after each green step on this branch, Conventional Commits, no
  push.
- A test that looks wrong is raised with Angelo, never weakened, skipped or deleted.
  Decisions 3 and 4 above are the two places where this slice touches what slice 0 tested.
- `pnpm aletheia` only: no task opens a store under `~/.aletheia/` or runs the installed
  `aletheia` (INV-01). `pnpm release` is Angelo's.
- Each task quotes the rule it implements; when the code and data-model.md or the contract
  disagree, the document is fixed in the same task.
