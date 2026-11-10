---

description: "Task list for 003-topic-review"
---

# Tasks: Topic Review

**Input**: Design documents from `specs/003-topic-review/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.6.0, ADRs 0002–0016

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario id they cover (`003-USx-ASy`). Watch them fail, write the minimum code, refactor.
Tests drive the public interface: `main(argv, context)` through `cliOnTempStore`, the exported
functions of `src/core` and `src/shell/db`, and the skill file on disk.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs; each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 topic review, US2 session cap, US3 new cards per day and share, US4 settings
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slices 0 to 2's, unchanged: `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one
folder per module with `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`, `<name>.errors.ts`,
`<name>.constants.ts` and `<name>.schema.ts`, each only when needed (ADR-0007); units import
each other through `#core/*` and `#shell/*`, one `index.ts` per unit (ADR-0004); only
`src/shell/db` knows SQLite and Drizzle (ADR-0010); only `src/core/time` imports `date-fns`.
Every failure named by its message is an error class in its module's `.errors.ts`, without the
`error: ` prefix the CLI edge adds. No comments (`local/no-comments`); no call taking a call
taking a call (`local/no-nested-calls`).

Shared by the CLI tests of this slice:

- a temp store per test from `cliOnTempStore({ clock, randomIndex })`
  (`tests/support/run-cli/run-cli.ts`). The clock is a `let now` the test moves; the default is
  `2026-11-12T02:00:00.000Z`, which is 21:00 of 2026-11-11 in `America/Bogota`, so the local
  today started at `2026-11-11T05:00:00.000Z` and tomorrow starts at
  `2026-11-12T05:00:00.000Z`;
- cards go in through `card add` with JSON built from `SAMPLE_DRAFT`
  (`tests/support/cards/cards.constants.ts`), with `tags` overridden;
- ids: the counting draw gives `0123`, `4567`, `89ab`, `cdef`, `ghjk`, `mnpq`, `rstv`, `wxyz`
  and then repeats. Beyond 8 cards, `uniqueIdDraw()` (T007) gives `0000`, `0001`, `0002`, …,
  unique up to 32⁴ cards and sorted in the order they were saved;
- states, dues and `last_review` are arranged with `runSql(cli.db, 'update cards …')`, and past
  reviews with `runSql(cli.db, insertSql('reviews', {...}))` (`tests/support/store/store.ts`),
  instants in UTC with milliseconds;
- lists are read with `run([..., '--json'])` and asserted field by field (`toMatchObject`, ids
  in order), so that a field added by a later task does not break them. Only the tests that
  print a contract block compare stdout exactly.

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is open (T001).** ADR-0016 and the command names of research R1 wait for Angelo.
   No task after T001 starts before he accepts them.
2. **The traceability test stays red until T020.** Spec 003 defines 23 ids with no test yet. A
   task closes with every check green except `tests/traceability`, whose list of missing ids
   shrinks by exactly the ids the task names. No test is changed for this (as in slices 1 and
   2).
3. **Three 001 tests change in T007, only with Angelo's OK.** `review due` gains `session`,
   `remaining`, `heldBack` and `capReached` (research R9). The three tests that compare its
   exact stdout (001-US2-AS1 "prints a new card as the contract shows it", and both 001-US2-AS5)
   get the new lines and nothing else. Their names, cards and other assertions stay. T007 stops
   and shows Angelo the diff of those three tests before going on.
4. **Scenarios with hundreds of cards are core unit tests.** 003-US3-AS5 (150 cards) runs over
   `sessionList` with `Card` objects built in the test. The CLI tests keep under 40 cards.
5. **The 20-card scenarios use review cards, not new ones.** They arrange `state = 'review'` and
   a due date today, so the daily limit of T011 does not change what they expect.
6. **`run` gains a fourth parameter, `flags`**: the command's own options, as commander parses
   them. Global options stay in `options`, and the commands that take no flags ignore it.

---

## Phase 1: Setup (gate)

- [X] T001 Gate: Angelo accepts ADR-0016 (status `accepted` in `docs/adr/0016-review-settings-in-one-row-with-a-nullable-column-each.md` and `docs/adr/README.md`) and the command names of `specs/003-topic-review/research.md` R1; design §5 gains **Settings** ("session size, new cards per day and new share, one set per store, `null` until Angelo changes one; changed only through the CLI") and §9 *Input* gains "numbers go as flags (`settings set --session-size 15`); free text goes as JSON on stdin", in `docs/design/2026-11-08-aletheia-design.md` (R10); one commit each

---

## Phase 2: Foundational

Intentionally empty. Every module, port method, option and migration lands with the first task
that needs it.

---

## Phase 3: Step 1 — Tags in use (US1)

**Goal**: the CLI lists every tag in use, with its ancestors and the active cards each covers.

**Independent Test**: `pnpm aletheia tag list` on a `test` store with cards under `messaging::*`
and `docker::*`.

- [X] T002 [US1] `tag list` prints the tag tree, in `src/core/tags/tags.ts` and `src/shell/cli/commands/tag-list/tag-list.ts`
  - **Test**:
    - `src/core/tags/tags.test.ts`, over `tagTree(cards: Card[]): TagCount[]` with `Card` objects built from `newCard(SAMPLE_DRAFT, id, instant)` and `tags` overridden:
      - `tagTree expands every tag into itself and its ancestors` — one card tagged `a::b::c` gives `a`, `a::b` and `a::b::c`, each with 1.
      - `tagTree counts a card once per tag` — a card tagged `messaging::rabbitmq` and `messaging::redis-streams` counts 1 under `messaging`.
      - `tagTree sorts by segments` — tags `messaging-legacy`, `messaging::rabbitmq` and `messaging` come out as `messaging`, `messaging::rabbitmq`, `messaging-legacy`.
    - `src/shell/cli/commands/tag-list/tag-list.test.ts`:
      - `003-US1-AS1 tag list gives every tag and its ancestors with the active cards each covers` — `card add` of four cards tagged `["messaging::redis-streams"]`, `["messaging::rabbitmq"]`, `["docker::commands"]` and `["messaging::rabbitmq", "messaging::redis-streams"]`. stdout is exactly:
        ```
        tags[5]{tag,cards}:
          docker,1
          "docker::commands",1
          messaging,3
          "messaging::rabbitmq",2
          "messaging::redis-streams",2
        ```
        (write the expected block from what `encode` prints for that value, if its quoting differs, and fix `contracts/cli.md` to match).
      - `tag list on an empty deck prints no tags` — stdout `tags: []\n`.
  - **Code**:
    - `src/core/tags/`: `index.ts`; `tags.constants.ts` with `TAG_SEPARATOR = '::'`; `tags.types.ts` with `TagCount = { tag: string; cards: number }`; `tags.ts` with `tagTree`: for each card, the set of its tags and every prefix ending at a `::`; count the cards whose set holds each tag; sort by comparing the `::`-split segments one by one, a shorter prefix first.
    - `src/core/similar/similar.constants.ts` loses `TAG_SEPARATOR`; `similar.ts` imports it from `#core/tags`.
    - `src/shell/cli/main/main.constants.ts`: `COMMAND_GROUPS` gains `tag: 'tags in use and the cards under them'`.
    - `src/shell/cli/commands/tag-list/tag-list.ts`: `tagListCommand` (`group: 'tag'`, `name: 'list'`, "list the tags in use, with their ancestors and how many active cards each covers"), returning `{ tags: tagTree(new StoreCardRepository(store).active()) }` inside `withStore`. Register it in `COMMANDS` in `src/shell/cli/main/main.ts`, before `reviewDueCommand`.
  - **Run**: `pnpm aletheia tag list`

**Checkpoint**: Claude can read the tags in use.

---

## Phase 4: Step 2 — A topic's cards (US1)

**Goal**: `review topic <tag>...` gives every active card under the tags, due or not, in the
spec's order, and refuses what it cannot answer.

**Independent Test**: quickstart §1.

- [X] T003 [US1] `review topic` holds the cards under the tags and their descendants, by whole segments, each once, in `src/core/tags/tags.ts` and `src/shell/cli/commands/review-topic/review-topic.ts`
  - **Test**:
    - `tags.test.ts`: `topicCards keeps the cards under a topic tag or its descendants` — over cards tagged `messaging`, `messaging::rabbitmq`, `messaging-legacy` and `docker`, topic `['messaging']` gives the first two and topic `['messaging::rabbitmq']` the second only. `topicCards lists a card once when several of its tags fall under the topic` — one card with `messaging::a` and `messaging::b`, topic `['messaging']` → one card.
    - `src/shell/cli/commands/review-topic/review-topic.test.ts`:
      - `003-US1-AS2 review topic holds a tag and its descendants, never a sibling prefix or an ancestor` — `card add` of four new cards tagged `messaging`, `messaging::rabbitmq`, `messaging-legacy`, `docker` (ids `0123` to `cdef`); `review topic messaging --json` → cards `['0123', '4567']`; `review topic messaging::rabbitmq --json` → `['4567']`.
      - `003-US1-AS6 review topic over two branches lists the cards under either, each once` — cards tagged `["messaging::redis-streams"]`, `["databases::redis"]`, `["messaging::redis-streams", "databases::redis"]` and `["docker"]`; `review topic messaging::redis-streams databases::redis --json` → `['0123', '4567', '89ab']`, `count: 3`.
  - **Code**:
    - `src/core/tags/tags.ts`: `topicCards(cards: Card[], topic: string[]): Card[]` — a card is under the topic when one of its tags equals a topic tag or starts with `${tag}${TAG_SEPARATOR}`. Export it from `index.ts`.
    - `src/shell/cli/invocation/session/session.ts`: move `dueItem` here from `review-due.ts` and import it in both commands.
    - `src/shell/cli/commands/review-topic/review-topic.ts`: `reviewTopicCommand` (`group: 'review'`, `name: 'topic'`, `argument: { name: '<tags...>', description: 'one or more tags; their descendants are included' }`, "list the active cards under the tags, due or not, due first"). It returns `{ count, nextDue, cards }` like `review due`, from `dueList(topicCards(active, args), now, tomorrow)`. Register it after `reviewDueCommand`.
  - **Run**: `pnpm aletheia review topic messaging`
- [X] T004 [US1] `review topic` orders due, new, then not due soonest first, and leaves out what was graded today, in `src/core/reviews/reviews.ts`
  - **Test**:
    - `src/core/time/time.test.ts`: `startOfToday is the start of the local day` — `2026-11-12T02:00:00.000Z` in `America/Bogota` → `2026-11-11T05:00:00.000Z`.
    - `src/core/reviews/reviews.test.ts`: `topicList puts the due list first, then review cards not due, soonest first` and `topicList leaves out a review card not due whose last review is today`. The existing `dueList` tests stay as they are.
    - `review-topic.test.ts`:
      - `003-US1-AS3 review topic lists due relearning, due review, new, then due in 3 and in 30 days, with their fields and count` — five cards tagged `messaging`, arranged as: `0123` review due `2026-11-14T15:00:00.000Z`, `4567` new, `89ab` review due `2026-12-11T15:00:00.000Z`, `cdef` relearning due `2026-11-12T01:50:00.000Z`, `ghjk` review due `2026-11-11T20:00:00.000Z`. The cards come as `['cdef', 'ghjk', '4567', '0123', '89ab']`, with `count: 5`, and each carries exactly `id`, `type`, `tags`, `question`, `keyPoints`, `answer`.
      - `003-US1-AS4 a topic card not due for 30 days is graded like any other` — `0123` review due `2026-12-12T02:00:00.000Z`. `review grade` with `{"card":"0123","grade":"good","claudeGrade":"good","answer":"x","rationale":"y"}` exits 0. `selectAll(cli.db, 'select * from reviews')` has one row with `state_before = 'review'` and `reviewed_at = '2026-11-12T02:00:00.000Z'`, and `card show 0123 --json` gives `lastReview` at now and a `due` other than before.
      - `003-US1-AS5 review topic leaves out a card graded today; a card graded Again comes back when its step ends` — four new cards tagged `messaging`. Grade `0123` Good, so it becomes review due in 2 days with its last review today. Grade `4567` Again, so it becomes learning due in 10 minutes. Arrange `89ab` as review due `2026-11-20T15:00:00.000Z`, and `cdef` as review due `2026-11-11T20:00:00.000Z`, so that a card is due and the 20-minute learn-ahead of 001-US2-AS4 stays off. At now, `review topic messaging` → `['cdef', '89ab']`. With the clock 11 minutes later → `['4567', 'cdef', '89ab']`.
  - **Code**:
    - `src/core/time/time.ts`: `startOfToday(now: Date, timeZone: string): Date`, exported from `index.ts`.
    - `src/core/reviews/reviews.ts`: `topicList(cards: Card[], now: Date, today: Date, tomorrow: Date): DueList` — the cards of `dueList(cards, now, tomorrow)`, then the `review` cards with `due >= tomorrow` whose `lastReview` is `null` or before `today`, by due. `nextDue` is the earliest `due` among the cards not listed. Export it.
    - `review-topic.ts` calls `topicList` with `startOfToday` and `startOfTomorrow`.
  - **Run**: quickstart §1, first two checks
- [X] T005 [US1] `review topic` refuses a malformed tag or a tag with no active card, and names the next due when it lists nothing, in `src/shell/cli/commands/review-topic/review-topic.schema.ts` and `src/core/tags/tags.errors.ts`
  - **Test**: `review-topic.test.ts`: `003-US1-AS7 review topic refuses a malformed tag or one with no active card, naming it; all graded today lists nothing and names the next due`. With cards under `messaging`:
    - `review topic messaging::Redis docker::` → exit 1, stdout empty, stderr ends `error: invalid topic: messaging::Redis: use a-z, digits and dashes, in segments joined by ::; docker::: use a-z, digits and dashes, in segments joined by ::\n`.
    - `review topic kafka messaging nats` → `error: no active card under kafka, nats\n`.
    - When every `messaging` card is review with its last review today and dues `2026-11-14T15:00:00.000Z` and `2026-11-20T15:00:00.000Z`, `review topic messaging --json` → `count: 0`, `cards: []`, `nextDue: '2026-11-14T10:00:00-05:00'`.
  - **Code**:
    - `review-topic.schema.ts`: `topicTagSchema = z.string().regex(TAG_PATTERN, MALFORMED_TAG)` (`MALFORMED_TAG` from `../card-add/card-add.constants.ts`), checked tag by tag.
    - `review-topic.errors.ts`: `InvalidTopicError(tags: string[])` → `invalid topic: <tag>: <MALFORMED_TAG>`, joined by `FIELD_SEPARATOR`.
    - `src/core/tags/tags.errors.ts`: `NoActiveCardUnderError(tags: string[])` → `no active card under <tags joined by ', '>`, thrown by `topicCards` for the topic tags that cover no card, in the topic's order.
  - **Run**: quickstart §1, the refusals

**Checkpoint**: the topic contract holds, without caps.

---

## Phase 5: Step 3 — "repasemos mensajería" (US1)

**Goal**: the review skill maps a topic Angelo names to tags and reviews only those.

**Independent Test**: `pnpm test -t 003-US1-AS8`. For real after the release (quickstart §5):
the skill calls the installed `aletheia`.

- [X] T006 [US1] `aletheia-review` reviews a named topic through `tag list` and `review topic`, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `tests/skills/review-skill.test.ts`: `003-US1-AS8 aletheia-review maps a named topic to tags from aletheia tag list and reviews them with aletheia review topic`. The description contains `repasemos <tema>`; the text contains `aletheia tag list`, `aletheia review topic` and `top-level tags`; 001-US2-AS7 still passes (no `DEVELOPMENT_ONLY` string).
  - **Code**:
    - Description: add `"repasemos <tema>"` to the triggers.
    - Section 1 becomes "Ask what is due, or a topic". A general review runs `aletheia review due`. For a topic ("repasemos mensajería"), run `aletheia tag list`, pick every tag that covers the topic (a topic can span branches: "redis" → `messaging::redis-streams` and `databases::redis`), and run `aletheia review topic <tag> <tag>`.
    - When no tag covers the topic, say so and name the top-level tags (those without `::`) from the list. Never guess a tag and never fall back to the general review.
    - A topic's cards are reviewed like due cards (sections 2 to 6), and section 6 re-asks with the same command.
  - **Run**: `pnpm test -t 003-US1-AS8`

**Checkpoint (MVP)**: US1 is complete; after a release, "repasemos mensajería" works in `prod`.

---

## Phase 6: Step 4 — Twenty cards, then ask (US2)

**Goal**: a session shows at most 20 distinct cards, counted from the review log; it can go on,
and Angelo can set its size for one session.

**Independent Test**: quickstart §2.

- [X] T007 [US2] `review due` and `review topic` start a session and hold at most 20 cards, saying how many remain, in `src/core/sessions/sessions.ts`
  - **Test**:
    - `src/shell/db/reviews/reviews.test.ts`: `since returns the reviews at or after the instant` — three reviews recorded with `record` at `T-1ms`, `T` and `T+1ms`; `since(T)` → the last two, with `reviewedAt` as `Date`.
    - `src/core/sessions/sessions.test.ts`, over `sessionList(input: SessionInput): SessionList`: `sessionList holds at most the session size and counts the rest as remaining`; `sessionList counts the distinct cards graded since the session start`; `sessionList puts a card graded in the session and due again first, taking no place`; `sessionList names as nextDue the earliest due among cards neither listed nor remaining`.
    - `src/shell/cli/commands/review-due/review-due.test.ts`: `003-US2-AS1 review due starts a session and holds 20 of 25 due cards, saying 5 remain`. The 25 cards come from `card add` with `uniqueIdDraw()`, arranged as review due `2026-11-11T20:00:00.000Z`. `--json` gives `session: '2026-11-11T21:00:00-05:00'`, `count: 20`, `remaining: 5`, `heldBack: 0`, `capReached: false`, and the first 20 ids in due order. `review topic applies the session cap too`: the same 25 cards tagged `docker`, `review topic docker --json` → `count: 20`, `remaining: 5`.
    - Raise decision 3 with Angelo. With his OK, the three exact-stdout 001 tests in `review-due.test.ts` gain the lines `session: "2026-11-11T21:00:00-05:00"` first and `remaining: 0`, `heldBack: 0`, `capReached: false` after `count`, and nothing else changes.
  - **Code**:
    - `tests/support/draws/draws.ts`: `uniqueIdDraw()`; draw `n` returns `floor(floor(n / 4) / bound ** (3 - n % 4)) % bound`.
    - `src/core/reviews/reviews.types.ts`: `ReviewRepository` gains `since(instant: Date): Review[]`. `src/shell/db/reviews/reviews.ts`: `StoreReviewRepository.since` selects `reviewed_at >= storedInstant(instant)`, ordered by `id`, mapped back to `Review`.
    - `src/core/settings/`: `settings.types.ts` with `Settings = { sessionSize: number; newPerDay: number; newShare: number }`; `settings.constants.ts` with `BUILT_IN_SETTINGS: Settings = { sessionSize: 20, newPerDay: 10, newShare: 10 }`; `index.ts`.
    - `src/core/sessions/`: `sessions.types.ts` with `SessionInput = { scope: Card[]; topic: boolean; reviews: Review[]; now: Date; today: Date; tomorrow: Date; start: Date; limits: Settings }` and `SessionList = { cards: Card[]; remaining: number; heldBack: number; capReached: boolean; nextDue: Date | null }`. `sessions.ts` with `sessionList`, following data-model.md "Session list": the eligible cards from `topic ? topicList : dueList`; graded in the session = distinct `cardId` of the reviews with `reviewedAt >= start`; re-shows first; then places `graded + 1` to `sessionSize` in eligible order; `remaining`, `capReached` and `nextDue` as data-model.md says. `heldBack` is 0 until T011, and there are no share places until T015.
    - `src/shell/cli/invocation/session/session.ts`: `listSession(store, context, scope: 'all' | string[])` builds the input (now, `startOfToday`, `startOfTomorrow`, start = now, `reviews.since(min(start, today))`, `BUILT_IN_SETTINGS`) and returns `{ session, count, remaining, heldBack, capReached, nextDue, cards }` in that order, with instants through `shownInstant`. Both `review-due.ts` and `review-topic.ts` call it.
  - **Run**: `pnpm aletheia review due`
- [X] T008 [US2] `--session` continues a round: re-shows are free and the cap is reported, in `src/shell/cli/invocation/session/session.schema.ts`
  - **Test**: `review-due.test.ts`:
    - `003-US2-AS2 at the cap, review due holds only the card graded Again and due again, and says the cap is reached with 5 remaining`. 25 cards are arranged as review due `2026-11-11T20:00:00.000Z`. Twenty reviews are inserted at `2026-11-12T01:30:00.000Z` for 20 of them, with `state_before = 'review'`. Nineteen of those 20 are arranged as review due `2026-11-20T15:00:00.000Z`, and one as relearning due `2026-11-12T01:40:00.000Z`. `review due --session 2026-11-11T20:25:00-05:00 --json` → cards `[that one]`, `capReached: true`, `remaining: 5`.
    - `003-US2-AS3 going on at the cap starts a new round of at most 20` — on the same store with the relearning card set to review due `2026-11-20T15:00:00.000Z`, `review due --json` without `--session` → the 5 remaining and `capReached: false`. Then, with 45 due and 20 graded, a new round holds 20 and says 5 remain.
    - `review due refuses a malformed or future --session` — `--session yesterday` → `error: invalid options: --session: must be an instant with its offset, like 2026-11-10T10:00:00-05:00\n`. `--session 2026-11-11T21:01:00-05:00` (1 minute ahead) → `error: invalid options: --session: is in the future\n`.
  - **Code**:
    - `src/shell/cli/main/main.types.ts`: `CommandOption = { flags: string; description: string }`, `Flags = Record<string, string | undefined>`, `CliCommand.options?: CommandOption[]`, and `run(context, options, args, flags: Flags)`. `main.ts` registers each option with `registered.option(flags, description)` and passes `registered.opts()` as `flags`.
    - `src/shell/cli/invocation/session/session.constants.ts`: `SESSION_OPTIONS` (`--session <instant>`: "the session printed by the first list of this round"), the option-to-flag names, `NOT_AN_INSTANT`, `IN_THE_FUTURE`.
    - `session.schema.ts`: `sessionFlagsSchema(now)`. `--session` must match `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$` and is parsed with `instantFrom`; later than now is refused.
    - `session.errors.ts`: `InvalidOptionsError(messages: string[])` → `invalid options: <flag>: <message>`, joined by `FIELD_SEPARATOR`, in the contract's order.
    - Both list commands take `options: SESSION_OPTIONS`, and `listSession` uses the parsed start.
  - **Run**: quickstart §2, the call with `--session`
- [X] T009 [US2] `--session-size` sets the size for one session, in `src/shell/cli/invocation/session/session.schema.ts`
  - **Test**: `review-due.test.ts`: `003-US2-AS4 a session of 10 holds 10 of 25 and the next session holds 20 again` — `review due --session-size 10 --json` → `count: 10`, `remaining: 15`; `review due --json` → `count: 20`. `review due refuses a session size below 1` — `--session-size 0`, `-1`, `1.5` and `ten` each → `error: invalid options: --session-size: must be a whole number, 1 or more\n`.
  - **Code**: `SESSION_OPTIONS` gains `--session-size <n>`. A whole number is `^\d+$` turned into a number, then checked against its minimum. `WHOLE_FROM_ONE = 'must be a whole number, 1 or more'`. `listSession` takes `limits = { ...BUILT_IN_SETTINGS, ...oneSession }`.
  - **Run**: quickstart §2
- [X] T010 [US2] `aletheia-review` repeats the session, stops at the cap and asks, and passes a size Angelo names, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`: `003-US2-AS5 aletheia-review stops at the cap, says how many remain, goes on only if Angelo says so, and passes a session size he names`. The text contains `--session`, `capReached`, `remaining`, `--session-size` and `hoy solo 10`.
  - **Code**:
    - Section 1: the first list prints `session`. Keep it, and pass `--session <instant>` on every later list call of the round, with any one-session limit.
    - "hoy solo 10" → `--session-size 10` on every call of the round.
    - Section 6: when the list runs out, ask again with `--session`. With `capReached: true` and `remaining > 0`, say how many cards remain and ask whether to go on. Go on only if Angelo says so, with a call without `--session` and without one-session limits: a new round, as if the session had just started (spec Clarifications).
    - A lost `session` (after a `/compact`) also starts a new round.
  - **Run**: `pnpm test -t 003-US2-AS5`

**Checkpoint**: US2 is complete.

---

## Phase 7: Step 5 — Ten new cards a day (US3)

**Goal**: a general review introduces at most 10 new cards per local day and says how many wait;
a topic review is not capped.

**Independent Test**: quickstart §3, first call.

- [ ] T011 [US3] A general review holds back new cards beyond the day's budget, in `src/core/sessions/sessions.ts`
  - **Test**:
    - `sessions.test.ts`:
      - `sessionList keeps the first saved new cards within the budget and counts the rest as held back`.
      - `sessionList counts as introduced today the reviews since the start of today whose state before was new`.
      - `sessionList brings back a learning card within 20 minutes when only held-back new cards are left` (R5).
      - `sessionList names the start of tomorrow as nextDue when new cards are held back and nothing comes sooner`.
    - `review-due.test.ts`:
      - `003-US3-AS1 review due introduces the 10 new cards saved first and holds 5 back until tomorrow` — 15 new cards via `uniqueIdDraw()` → `count: 10`, ids `0000` to `0009`, `heldBack: 5`, `remaining: 0`.
      - `003-US3-AS2 new cards first graded today count, in any review, and the next local day starts at 10 again` — 14 cards. Four are arranged as review due `2026-11-14T15:00:00.000Z`, with reviews inserted at `2026-11-11T15:00:00.000Z` and `state_before = 'new'` → `count: 6`, `heldBack: 4`. With the clock at `2026-11-13T02:00:00.000Z` → 10 new.
      - `nothing due but new cards held back: the list is empty, says how many wait and names tomorrow` — 10 introduced today (arranged as in AS2, review due `2026-11-14T15:00:00.000Z`), 3 new → `count: 0`, `heldBack: 3`, `nextDue: '2026-11-12T00:00:00-05:00'`.
  - **Code**:
    - `sessionList`: if `topic` is false, the budget is `max(0, newPerDay - introduced today)`. New cards past the budget, in saved order, leave the scope before `dueList` runs. `heldBack` is their count.
    - `nextDue` takes the earlier of its value and `tomorrow` when `heldBack > 0`.
  - **Run**: quickstart §3, first call
- [ ] T012 [US3] A topic review includes its new cards without the daily limit, in `src/core/sessions/sessions.ts`
  - **Test**: `review-topic.test.ts`: `003-US3-AS3 review topic includes all 15 new cards of the topic, even after 10 were introduced today`. There are 25 cards via `uniqueIdDraw()`. Ten are tagged `docker` and arranged as review due `2026-11-14T15:00:00.000Z`, with reviews inserted today and `state_before = 'new'`. Fifteen are new, tagged `messaging`. `review topic messaging --json` → `count: 15`, `heldBack: 0`.
  - **Code**: none expected beyond T011's `topic` branch. If the test passes at once, check it fails with the budget forced on for topics, then restore.
  - **Run**: `pnpm test -t 003-US3-AS3`
- [ ] T013 [US3] `--new-per-day` sets the daily limit for one session, in `src/shell/cli/invocation/session/session.schema.ts`
  - **Test**: `review-due.test.ts`: `003-US3-AS4 asking for 20 new today, with 4 introduced, holds at most 16; the next session is back to 10 a day` — 34 cards via `uniqueIdDraw()`. Four were introduced today (as in AS2) and 30 are new. `review due --new-per-day 20 --json` → 16 new. `review due --json` → 6 new. `review due refuses a daily limit below 0` — `--new-per-day -1` → `error: invalid options: --new-per-day: must be a whole number, 0 or more\n`.
  - **Code**: `SESSION_OPTIONS` gains `--new-per-day <n>`; `WHOLE_FROM_ZERO`.
  - **Run**: `pnpm aletheia review due --new-per-day 20`
- [ ] T014 [US3] `aletheia-review` mentions the held-back cards and passes a daily limit Angelo names, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`: `aletheia-review mentions held-back new cards and passes a daily limit Angelo names for the session`. The text contains `heldBack`, `--new-per-day` and `hoy dame 20 nuevas`.
  - **Code**:
    - Section 1: with `heldBack > 0`, say in a line how many new cards wait for tomorrow. With `count: 0` and `heldBack > 0`, say so, and when the next card comes, from `nextDue`.
    - "hoy dame 20 nuevas" → `--new-per-day 20` on every call of the round.
  - **Run**: `pnpm test -t aletheia-review`

**Checkpoint**: the daily limit holds in general reviews and not in topics.

---

## Phase 8: Step 6 — A share for new cards (US3)

**Goal**: each session keeps a share of its places for new cards, so a backlog never holds them
all back.

**Independent Test**: quickstart §3, second call.

- [ ] T015 [US3] The session spreads its share of new cards, in `src/core/sessions/sessions.ts`
  - **Test**: `sessions.test.ts`:
    - `003-US3-AS5 with 100 reviews due and 50 new, a session of 20 holds 18 reviews and 2 new, the 10th and the 20th`. Places 10 and 20 are new and the rest are reviews in due order; `remaining: 90`, `heldBack: 40`.
    - `sessionList places the i-th of k share places at ceil(i × size / k)` — size 20 at 20 % → 5, 10, 15, 20.
    - `sessionList keeps share places already passed in the session` — 10 graded in the session, size 20 at 10 % → the new card is the 10th of the list (place 20).
    - `sessionList gives the daily limit the last word` — size 200 at 10 % with a budget of 10 → 10 new.
  - **Code**: `k = ceil(sessionSize × newShare / 100)` and places `ceil(i × sessionSize / k)` (`PERCENT = 100` in `sessions.constants.ts`). In the filling loop of data-model.md step 4, a share place takes a new card first.
  - **Run**: `pnpm test src/core/sessions`
- [ ] T016 [US3] `--new-share` sets the share for one session, in general and topic reviews, in `src/shell/cli/invocation/session/session.schema.ts` and `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-due.test.ts`: `003-US3-AS6 a session of 5 at 10 % holds 1 new card, none at 0 %, new cards fill it when few reviews are due, and the same in a topic`. Cards: 10 review due today and 10 new, all tagged `messaging`.
    - `review due --session-size 5 --json` → 4 reviews, then 1 new at place 5.
    - `--new-share 0` → 5 reviews.
    - With only 3 reviews due → 3 reviews and 2 new.
    - `review topic messaging --session-size 5` → the same three outcomes.
    - `review due refuses a share outside 0 to 100` — `--new-share 101` → `error: invalid options: --new-share: must be a whole number from 0 to 100\n`.
    - `review-skill.test.ts`: the text contains `--new-share`.
  - **Code**: `SESSION_OPTIONS` gains `--new-share <percent>`; `WHOLE_PERCENT`. In the skill, a share Angelo names for one session ("hoy la mitad nuevas") → `--new-share 50` on every call of the round.
  - **Run**: quickstart §3, second call

**Checkpoint**: US3 is complete.

---

## Phase 9: Step 7 — Defaults that stay (US4)

**Goal**: Angelo's lasting defaults live in the store, shown and changed through the CLI; the
lists use them below a one-session limit.

**Independent Test**: quickstart §4.

- [ ] T017 [US4] `settings show` gives each setting and whether it is the built-in default, in `src/shell/db/settings/settings.ts` and `src/shell/cli/commands/settings-show/settings-show.ts`
  - **Test**:
    - `src/shell/db/settings/settings.test.ts`, over a store from `openTestStore(path)`:
      - `stored reads every setting as null with no row`.
      - `the store refuses a second settings row and every value out of range` — `runSql` inserts of `id = 2`, `session_size = 0`, `new_per_day = -1`, `new_share = 101` each throw.
    - `src/shell/cli/commands/settings-show/settings-show.test.ts`: `003-US4-AS1 settings show gives session size 20, new cards per day 10 and new share 10, each marked as the built-in default`. stdout is exactly:
      ```
      settings[3]{name,value,default}:
        session-size,20,true
        new-per-day,10,true
        new-share,10,true
      ```
  - **Code**:
    - `src/shell/db/settings/settings.schema.ts`: `settings = sqliteTable('settings', { id: integer().primaryKey(), sessionSize: integer('session_size'), newPerDay: integer('new_per_day'), newShare: integer('new_share') })`, with checks `settings_single_row` `id = 1`, `settings_session_size` "`null` or 1 or more", `settings_new_per_day` "`null` or 0 or more" and `settings_new_share` "`null` or 0 to 100".
    - `pnpm db:generate --name settings`; read the SQL before committing.
    - `src/core/settings/settings.types.ts`: `StoredSettings = { [K in keyof Settings]: number | null }` and `SettingsRepository { stored(): StoredSettings; save(changes: Partial<StoredSettings>): StoredSettings }`.
    - `src/shell/db/settings/settings.ts`: `StoreSettingsRepository implements SettingsRepository`. `stored` reads row 1, or all `null` without it. `save` upserts row 1 with `onConflictDoUpdate`, setting only the named columns. Export it from `src/shell/db/index.ts`.
    - `COMMAND_GROUPS` gains `settings: 'lasting defaults for reviews'`. `settingsShowCommand` (`group: 'settings'`, `name: 'show'`, "print each review setting and whether it is the built-in default") returns `{ settings: [{ name, value, default }] }` in the order `session-size`, `new-per-day`, `new-share`.
  - **Run**: `pnpm aletheia settings show`
- [ ] T018 [US4] `settings set` changes the named settings or refuses with nothing changed, in `src/shell/cli/commands/settings-set/settings-set.ts`
  - **Test**: `src/shell/cli/commands/settings-set/settings-set.test.ts`:
    - `003-US4-AS3 settings set refuses an out-of-range value, naming each, and changes nothing`. `settings set --session-size 15` first. Then `settings set --session-size 0 --new-per-day -1 --new-share 101` → exit 1, stderr ends `error: invalid settings: --session-size: must be a whole number, 1 or more, or default; --new-per-day: must be a whole number, 0 or more, or default; --new-share: must be a whole number from 0 to 100, or default\n`. `settings show --json` still gives 15 with `default: false` and the other two with `default: true`.
    - `settings set saves the named settings, forgets one with default, and prints them`: `--session-size 15 --new-share 20` → stdout like `settings show`, with those two `default: false`; `--session-size default` → `session-size,20,true`.
    - `settings set with no setting is refused`: → `error: name a setting: --session-size, --new-per-day or --new-share\n`.
  - **Code**:
    - `settingsSetCommand` (`group: 'settings'`, `name: 'set'`, "change the review settings named; default forgets one") takes the three numeric options of `SESSION_OPTIONS` (shared constants) and parses each with the whole-number schemas of T009, T013 and T016, extended to accept `default` as `null`, with `, or default` added to the messages.
    - Errors: `InvalidSettingsError(messages)` and `NoSettingNamedError`.
    - The command calls `save`, then prints what `settings show` prints.
  - **Run**: quickstart §4
- [ ] T019 [US4] The lists take a setting below a one-session limit, in `src/core/settings/settings.ts`
  - **Test**:
    - `src/core/settings/settings.test.ts`: `settingsFrom takes the one-session value, else the stored one, else the built-in`.
    - `review-due.test.ts`: `003-US4-AS2 a saved session size of 15 holds at most 15, and a session size of 10 for the session holds 10`. Save `settings set --session-size 15`; 25 review cards due. `review due --json` → `count: 15`; `review due --session-size 10 --json` → `count: 10`.
  - **Code**: `settingsFrom(oneSession: Partial<Settings>, stored: StoredSettings): Settings`. `listSession` reads `new StoreSettingsRepository(store).stored()` and passes `settingsFrom(oneSession, stored)` as the limits.
  - **Run**: quickstart §4, then `pnpm aletheia review due`
- [ ] T020 [US4] `aletheia-review` tells a lasting limit from a one-session one and saves it only after approval, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`: `003-US4-AS4 aletheia-review saves a lasting limit through aletheia settings set only after Angelo approves the exact change`. The text contains `aletheia settings show`, `aletheia settings set`, `a partir de ahora`, `hoy solo 10` and `the exact command`.
  - **Code**: a section "Limits that stay":
    - "a partir de ahora", "siempre" or "de ahora en adelante" is a lasting change; "hoy" or a number for this review is a one-session flag (section 1).
    - For a lasting change, show the exact command (`aletheia settings set --session-size 15 --new-share 20`) and run it only after Angelo approves. Then the next lists use it without a flag.
    - Questions about the current limits run `aletheia settings show`. Going back to the built-in value is `default`.
  - **Run**: `pnpm test -t 003-US4-AS4`

**Checkpoint**: every id of spec 003 has its test; `tests/traceability` is green.

---

## Phase 10: Close

- [ ] T021 Update `CLAUDE.md` and the contract: Commands names `tag list`, `review topic`, `settings show|set`, the session options and `specs/003-topic-review/contracts/cli.md`; `specs/003-topic-review/contracts/cli.md` gets any message or quoting a task changed; `pnpm check` green, traceability included; commit `docs: close slice 3 tasks`
- [ ] T022 Hand off: Angelo merges `003-topic-review` into `main` and runs `pnpm release` from a clean `main` (give him the commands, run neither); the release backs up `prod` before the `settings` migration; then quickstart §5 in `prod`, and the Measures of `specs/003-topic-review/quickstart.md` after two weeks (SC-002 to SC-006)

---

## Dependencies & Execution Order

- T001 blocks everything.
- US1: T002 → T003 → T004 → T005 → T006. T006 needs T005 (the command it names exists and
  refuses as the skill says).
- US2: T007 needs T004 (`topicList`, `startOfToday`). Then T007 → T008 → T009 → T010.
- US3: T011 needs T009 (options in `main`). T011 → T012 → T013 → T014 (skill, after T010) →
  T015 → T016.
- US4: T017 needs T016 (the shared numeric schemas). T017 → T018 → T019 → T020 (skill, after
  T016).
- T021 needs all; T022 needs T021.

## Parallel Opportunities

- None across tasks: the lists, the session unit and the skill file are shared by nearly every
  task. T002's core tests and CLI test can be written side by side.
- T017's store and migration work does not touch the lists, so an implementer could start it
  beside T011–T016. Its command options reuse T016's schemas, though, so it closes after T016.

## Implementation Strategy

1. **MVP**: Phases 3–5 (US1). After a merge and a release, "repasemos mensajería" works in
   `prod`, with no caps.
2. **Then** Phase 6 (US2), Phases 7–8 (US3) and Phase 9 (US4), each a release Angelo could take
   on its own. Phase 9 can move to its own slice if this one outgrows two days (constitution V).
3. Commit after every green task on `003-topic-review`; `pnpm check` before closing each task,
   with the traceability exception of decision 2.
