---

description: "Task list for 006-progress"
---

# Tasks: Progress

**Input**: Design documents from `specs/006-progress/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.6.0, ADRs 0002–0018

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario id they cover (`006-USx-ASy`). Watch them fail, write the minimum code, then
refactor. Tests drive the public interface: `main(argv, context)` through `cliOnTempStore`, the
exported functions of `src/core`, and the skill file on disk.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs, and each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 how each topic is going, US2 which cards, US3 how the reviews went
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slices 0 to 5's, unchanged:

- Code lives in `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one folder per
  module, with `.test.ts`, `.types.ts`, `.errors.ts`, `.constants.ts` and `.schema.ts` files
  each only when needed (ADR-0007).
- Units import each other through `#core/*` and `#shell/*` (ADR-0004), and only `src/shell/db`
  knows SQLite and Drizzle (ADR-0010).
- Every conventional literal (`30`, `4`, a field name, a message) is a named constant.
- No comments, and no call taking a call taking a call (lint).

Shared by the tests of this slice:

- The clock: `NOW = new Date('2026-11-15T20:00:00.000Z')`, 15:00 in `America/Bogota`, the zone
  of `runCli`. Today starts at `2026-11-15T05:00:00.000Z`, tomorrow at
  `2026-11-16T05:00:00.000Z`, and the 30-day window at `2026-10-17T05:00:00.000Z`.
- `tests/support/progress/progress.ts` (decision 4), for the three CLI test files and the
  performance test:
  - `addTagged(cli, tagLists)`: `card add --json` with `taggedDrafts(tagLists)` on a CLI built
    with `randomIndex: uniqueIdDraw()`; returns the ids in order.
  - `studied(db, id, state, due)`: `runSql(db, "update cards set state = …, due = … where id = …")`.
  - `reviewed(db, id, reviewedAt, fields = {})`: `runSql(db, insertSql('reviews', …))` with
    `grade: 'good'`, `claude_grade: 'good'`, `state_before: 'review'`, `answer: 'a'`,
    `rationale: 'r'`, and `fields` (`flag`, `grade`, `state_before`, `asked_question`) over them.
  - `rowCounts(db)`: `select count(*)` of `cards`, `card_tags` and `reviews`, to check a command
    wrote nothing.
- `tests/support/reviews/reviews.ts`: `reviewOf(cardId, reviewedAt, fields = {})`, a `Review`
  with the same defaults, for `src/core/progress/progress.test.ts`.

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is closed.** Angelo accepted the commands and options of research R1 and R2 on
   2026-11-15. T001 only brings the design up to date.
2. **The traceability test stays red until T015.** A task closes with every check green except
   `tests/traceability`, and its list of missing ids shrinks by exactly the ids the task names.
3. **Columns land one task at a time.** CLI tests read `--json` and assert with
   `toMatchObject` on their task's fields, so a later column breaks none. Each command's last
   task adds one test that fixes its TOON, and the contract takes whatever that test prints.
4. **Arrangement helpers are shared (jscpd).** The three CLI test files arrange cards and
   reviews through `tests/support/progress/`, as `review-due.test.ts` does inline. If jscpd
   flags `graded()` in `src/core/sessions/sessions.test.ts` against `reviewOf`, it switches to
   `reviewOf` with no assertion changed.
5. **`topicFrom` moves (T006).** It leaves `review-topic.ts` for
   `src/shell/cli/invocation/topic/topic.ts`, with `InvalidTopicError` and `topicTagSchema`, so
   four commands share it. `review-topic.test.ts` stays as it is.
6. **The option plumbing grows in place (T007).** `Flags` in `src/shell/cli/main/main.types.ts`
   becomes `Record<string, string | boolean | undefined>`. `OPTION_FLAGS` in
   `src/shell/cli/invocation/session/session.constants.ts` gains each new flag, so
   `optionMessages` and `InvalidOptionsError` serve every command.
7. **The window helper is `startOfWindow` (R3).** `startOfWindow(now, days, timeZone)` in
   `src/core/time/time.ts` is the start of the local day `days − 1` days before today, so
   `startOfWindow(now, 1, zone)` is `startOfToday`.

---

## Phase 1: Setup (gate)

- [X] T001 The design catches up (research R10), in `docs/design/2026-11-08-aletheia-design.md`
  - §8.3, the bullet on prune candidates: "Shows how many prune candidates exist … arrives with
    prune (slice 7)."
  - §12: drop "Retention formula and time window for stats; leech threshold", and point to
    `specs/006-progress/research.md` R3 and R4.
  - Commit `docs(design): progress decided in spec 006`.

---

## Phase 2: Foundational

Intentionally empty. Every type, helper and field lands with the first task that needs it.

---

## Phase 3: Step 1 — How each topic is going (US1)

**Goal**: `tag stats` gives every tag and the deck their six numbers; the stats skill answers
"¿cómo voy?".

**Independent Test**: quickstart §1.

- [X] T002 [US1] `tag stats` gives each tag and the deck their cards, new cards and cards due today, in `src/core/progress/progress.ts` and `src/shell/cli/commands/tag-stats/tag-stats.ts`
  - **Test**:
    - `src/core/time/time.test.ts`: `startOfWindow` of 1 day is `startOfToday`; of 30 days at `NOW` in `America/Bogota` is `2026-10-17T05:00:00.000Z`.
    - `src/core/progress/progress.test.ts`, through `tagProgress(input)`:
      - A card under `messaging::rabbitmq` and `messaging::redis-streams` counts once in `messaging`, once in each child, and once in `deck`.
      - States: `review` due `2026-11-15T23:00:00.000Z` is due; `review` due `2026-11-16T06:00:00.000Z` is not; `learning` due later today is due; `new` counts in `new`, never in `due`.
      - A `review` card due today with a review today flagged `badly-written` is not due.
    - `src/shell/cli/commands/tag-stats/tag-stats.test.ts`:
      - `006-US1-AS1 tag stats gives every tag in use and its ancestors, and the deck, with their cards, new cards and cards due today, each card once`: three cards through `addTagged`, two `studied` as `review` due today; `--json` matches `{ deck: { cards: 3, new: 1, due: 2 }, tags: [...] }` in segment order. `rowCounts` is the same before and after.
      - `tag stats on an empty deck gives a deck of zeros and no tags`.
  - **Code**:
    - `src/core/time/time.ts`: `startOfWindow(now, days, timeZone)` (decision 7).
    - `src/core/tags/`: export `coveredTags(card)` (a card's tags and their ancestors, once each) and `bySegments`; `tagTree` uses `coveredTags`.
    - `src/core/progress/`, new: `progress.types.ts` (`ProgressInput = { cards, reviews, today, tomorrow, windowStart }`, `ProgressCounts`, `TagProgress`, `ProgressTree = { deck, tags }`), `progress.constants.ts` (`EVER = new Date(0)`), `progress.ts` (`tagProgress`), `index.ts`. Due today follows data-model.md: "state `learning`, `relearning` or `review`, `due < tomorrow`, and no review since `today` whose policy `hidesUntilTomorrow`".
    - `src/shell/cli/commands/tag-stats/tag-stats.ts`: group `tag`, name `stats`; `withStore` reads `StoreCardRepository.active()` and `StoreReviewRepository.since(EVER)`, computes `today`, `tomorrow` and `windowStart` (30 days) through `#core/time`, and returns `tagProgress(…)`. Registered in `src/shell/cli/main/main.ts` after `tagListCommand`.
  - **Run**: `pnpm aletheia tag stats`
- [X] T003 [US1] `tag stats` gives retention over the counted reviews of the last 30 days, in `src/core/progress/progress.ts` and `src/core/reviews/reviews.constants.ts`
  - **Test**:
    - `src/core/reviews/reviews.test.ts`: `countsInStats` is `true` for no flag and `missing-prerequisite`, `false` for `badly-written` and `badly-rephrased`.
    - `progress.test.ts`, `006-US1-AS2 retention is the share passed of the counted reviews of the last 30 days`:
      - Card A: `good` and `again` from `review`; card B: `good` from `review` → `67` (2 of 3, `Math.round`).
      - Left out: a `good` from `new`, from `learning` and from `relearning`; a `good` flagged `badly-written` and an `again` flagged `badly-rephrased`; a `good` at `2026-10-17T04:59:59.000Z`.
      - A `missing-prerequisite` `again` from `review` counts as not passed.
      - A tag whose cards have no counted review has `retention: null`, and so has an empty deck.
    - `tag-stats.test.ts`: `006-US1-AS2 tag stats gives a tag's retention over its cards' counted reviews` arranges A and B with `reviewed`, and `--json` gives the same `67` on their tag and on `deck`.
  - **Code**:
    - `src/core/reviews/reviews.types.ts` and `reviews.constants.ts`: `FlagPolicy` gains `countsInStats`, `true` in `NO_FLAG`, `false` in `VOIDED`.
    - `progress.constants.ts`: `PROGRESS_WINDOW_DAYS = 30`, which `tag-stats.ts` passes to `startOfWindow`.
    - `progress.ts`: a review is counted when "`policyOf(flag).countsInStats` and `stateBefore = review`", passed when also "`grade ≠ again`"; retention is "passed ÷ counted, over the covered cards' counted reviews in the window, as a whole percent (`Math.round`); `null` with no counted review".
  - **Run**: quickstart §1, the retention point
- [X] T004 [US1] `tag stats` gives weak cards and gaps, in `src/core/progress/progress.ts`
  - **Test**:
    - `progress.test.ts`, `006-US1-AS3 a card with 4 failures is weak under each of its tags, and a gap counts under the reviewed card's tags`:
      - 4 `again` from `review`, one of them on `2026-01-01`, make the card weak in each covered row and in `deck`; 3 do not.
      - Not failures: an `again` flagged `missing-prerequisite`, flagged `badly-written`, or from `learning`.
      - A `missing-prerequisite` review inside the window is a gap of the card's tags; one before `windowStart` is not.
    - `tag-stats.test.ts`:
      - `006-US1-AS3 tag stats gives the weak cards and gaps of each tag`, arranged through `reviewed`.
      - `tag stats prints the tree as TOON` (decision 3): the exact stdout of a two-tag deck, `deck:` then `tags[n]{tag,cards,new,due,retention,weak,gaps}:`.
    - `tests/progress/performance.test.ts`: `SC-003 tag stats answers in under 1 second on 1,000 cards and 20,000 reviews`. One `card add` of 1,000 drafts under 20 tags; one `runSql` of 20,000 `reviews` rows inside `begin`/`commit`; `performance.now()` around `tag stats`.
  - **Code**: `progress.constants.ts`: `WEAK_FAILURES = 4`. `progress.ts`: a failure is "counted, `grade = again`, and `flag ≠ missing-prerequisite`", ever; weak is "`failures ≥ WEAK_FAILURES`"; a gap is "`flag = missing-prerequisite` and `reviewedAt ≥ windowStart`".
  - **Run**: `pnpm aletheia tag stats`, and `pnpm test -t SC-003`
- [X] T005 [US1] The `aletheia-stats` skill answers "¿cómo voy?" from `aletheia tag stats`, in `.claude/skills/aletheia-stats/SKILL.md`
  - **Test**: `tests/skills/stats-skill.test.ts`, `006-US1-AS6 aletheia-stats carries its Spanish triggers, answers every progress question from the installed aletheia, explains weak and gaps, and writes nothing`:
    - `name` is `aletheia-stats`. The description contains `¿cómo voy?`, `¿qué tengo flojo?`, `¿qué no repaso hace un mes?`, `¿qué fallé esta semana?` and `muéstrame mi progreso`, and none of them is in `aletheia-review`'s description.
    - The text contains `aletheia tag stats`, `aletheia tag list`, `never from memory`, `4 failures` and `missing-prerequisite`, and `repasemos` as the hand-over.
    - The text contains none of `DEVELOPMENT_ONLY`, nor `aletheia card add`, `aletheia card edit`, `aletheia review grade`, `aletheia settings set` or `aletheia backup`.
  - **Code**: `SKILL.md` (research R9), modeled on `aletheia-review`'s Rules: talk in Spanish; run the installed `aletheia` in the turn of every progress question, never from memory or from earlier in the session; never open a store or choose an environment; read instants as printed. Section 1, "¿cómo voy?": run `aletheia tag stats`, lead with the deck line, then the topics worth a remark. The first time weak or gaps appear, say in a line what they mean: a weak card has 4 failures or more on cards already learned, a gap is a review flagged `missing-prerequisite` in the last 30 days, and a topic with gaps lacks a base, which is not the same as a weak topic. `null` retention is "sin repasos que cuenten aún", never 0%. To study a topic, offer "repasemos <tema>", which `aletheia-review` handles. The skill writes nothing.
  - **Run**: `pnpm test -t 006-US1-AS6`. The skill calls the installed `aletheia`, so Angelo uses it after the release (quickstart §5).

**Checkpoint**: "¿cómo voy?" has its full answer after a release.

---

## Phase 4: Step 2 — Filter and sort the tree (US1)

**Goal**: "¿y de aws?" and "¿cuál va peor?" reorder or narrow the same tree.

**Independent Test**: quickstart §2.

- [X] T006 [US1] `tag stats [tags...]` gives only those tags and their descendants, in `src/shell/cli/commands/tag-stats/tag-stats.ts`
  - **Test**: `tag-stats.test.ts`:
    - `006-US1-AS4 tag stats under a tag gives only it and its descendants, and a deck over their cards`: cards under `messaging::…` and `docker::…`; `tag stats messaging --json` gives only `messaging…` rows, and `deck.cards` counts the `messaging` cards.
    - `006-US1-AS4 tag stats refuses a tag with no active card under it`: `tag stats kafka` exits 1, stdout empty, stderr `error: no active card under kafka`. A malformed tag gives `error: invalid topic: …`, as in `review topic`.
  - **Code**: decision 5; `tag-stats.ts` takes `argument: { name: '[tags...]', … }`, and with tags scopes the cards through `topicCards(active, topicFrom(tags))` before `tagProgress`. Rows outside the topic tags (their ancestors) are left out.
  - **Run**: quickstart §2, the first command
- [X] T007 [US1] `tag stats --sort <field> [--desc]` orders siblings under their parent, in `src/core/progress/progress.ts`
  - **Test**:
    - `progress.test.ts`: under `--sort retention`, `messaging::rabbitmq` (91) and `messaging::redis-streams` (71) swap, each still after `messaging`; `--desc` reverses them; a row with `retention: null` is last in either direction; ties keep segment order.
    - `tag-stats.test.ts`: `006-US1-AS5 tag stats sorts siblings by a field in either direction` (`--sort retention`, then with `--desc`), and `006-US1-AS5 tag stats refuses an unknown sort field naming the valid ones`: `--sort nope` exits 1 with `error: invalid options: --sort: must be tag, cards, new, due, retention, weak or gaps`.
  - **Code**: decision 6. `progress.constants.ts`: `TAG_SORT_FIELDS = ['tag', 'cards', 'new', 'due', 'retention', 'weak', 'gaps'] as const`. `tagProgress(input, order)` with `order = { field, desc }`, default `{ field: 'tag', desc: false }`: siblings sorted under their parent, depth first; `null` last; ties by `bySegments`. `src/shell/cli/commands/tag-stats/tag-stats.schema.ts` validates `sort` (one of the fields, message built with `oneOf` from `src/shell/cli/invocation/input`) and `desc` (boolean). Options `--sort <field>` and `--desc`.
  - **Run**: quickstart §2
- [X] T008 [US1] `aletheia-stats` narrows the tree to a topic and sorts it, in `.claude/skills/aletheia-stats/SKILL.md`
  - **Test**: `stats-skill.test.ts`: `006-US1-AS6 aletheia-stats finds a Spanish topic's tags in aletheia tag list and passes them, and a sort, to aletheia tag stats`. The text contains `aletheia tag stats <tags>`, `--sort retention`, `--desc` and `¿cuál va peor?`.
  - **Code**: a topic named in Spanish ("¿y de mensajería?") maps to tags from `aletheia tag list`, as in `aletheia-review` section 1. "¿cuál va peor?" is `--sort retention`; "¿dónde tengo más flojas?" is `--sort weak --desc`.
  - **Run**: `pnpm test -t 006-US1-AS6`

**Checkpoint**: every id of US1 has its test.

---

## Phase 5: Step 3 — Which cards (US2)

**Goal**: "¿qué tengo flojo de mensajería?" and "¿qué no repaso hace un mes?" give the cards.

**Independent Test**: quickstart §3.

- [ ] T009 [US2] `card list [tags...] [--weak] [--gaps]` gives each matching card with its facts, in `src/core/progress/progress.ts` and `src/shell/cli/commands/card-list/card-list.ts`
  - **Test**:
    - `progress.test.ts`, through `cardProgress(input, filters)`: each card carries `failures`, `gaps`, `weak` and `lastReview` ("its latest `reviewedAt`, voided reviews included; `null` if never reviewed"); `weak: true` keeps only weak cards, `gaps: true` only cards with `gaps > 0`, and both keep cards matching both.
    - `src/shell/cli/commands/card-list/card-list.test.ts`: `006-US2-AS1 card list gives the cards under a tag matching every filter, with id, question, tags, state, due, last review, failures and gaps`: a weak card with a gap, a weak card without, a card with neither; `card list messaging --weak --gaps --json` gives only the first, `due` and `lastReview` shown in local time. `rowCounts` unchanged.
  - **Code**: `cardProgress` reuses T002–T004's per-card facts; types `CardProgress`, `CardFilters`. `card-list.ts`: group `card`, name `list`, `[tags...]` through `topicFrom`, options `--weak` and `--gaps`; each row `id`, `question`, `tags`, `state`, `due`, `lastReview`, `failures`, `gaps`, `weak`, instants through `shownInstant`. Registered after `cardSearchCommand`. Default order: `lastReview`, then `id`, `null` last.
  - **Run**: `pnpm aletheia card list --weak`
- [ ] T010 [US2] `card list --not-reviewed <days>` gives the cards with no review in that window, never-reviewed ones included, in `src/core/progress/progress.ts`
  - **Test**:
    - `progress.test.ts`: with `notReviewed` set to the start of a 30-day window, a card last reviewed `2026-10-01` is kept; one reviewed `2026-11-01` is not; one whose only review is voided on `2026-11-01` is not; one never reviewed and saved `2026-10-01` is kept with `lastReview: null`; one never reviewed and saved `2026-11-10` is not.
    - `card-list.test.ts`: `006-US2-AS1 card list --not-reviewed 30 gives the cards with no review in the last 30 days`, and `006-US2-AS2 card list --not-reviewed gives a card never reviewed when it was saved before the window` (its `created_at` set through `runSql`). `--not-reviewed 0` and `--not-reviewed x` exit 1 with `error: invalid options: --not-reviewed: must be a whole number, 1 or more`.
  - **Code**: the rule "`lastReview < windowStart(n)`, or never reviewed and `createdAt < windowStart(n)`". `card-list.schema.ts` validates `notReviewed` with `WHOLE_NUMBER` and the message of `LIMIT_RULES.sessionSize`; `tag-stats.ts` and `card-list.ts` compute windows through `startOfWindow`.
  - **Run**: quickstart §3, the first command
- [ ] T011 [US2] `card list --sort <field> [--desc]` orders the cards, in `src/core/progress/progress.ts`
  - **Test**:
    - `card-list.test.ts`: `006-US2-AS3 card list sorts by a field in either direction` (`--sort failures --desc`, then `--sort due`); `006-US2-AS3 card list refuses an unknown sort field naming the valid ones` → `error: invalid options: --sort: must be id, state, due, lastReview, failures or gaps`; `card list prints the cards as TOON` (decision 3).
    - `performance.test.ts`: `SC-003 card list answers in under 1 second on 1,000 cards and 20,000 reviews`, on the same arranged store.
  - **Code**: `CARD_SORT_FIELDS = ['id', 'state', 'due', 'lastReview', 'failures', 'gaps'] as const`; `id` and `state` as text, `due` and `lastReview` as instants, `null` last, ties by `id`. The sort shares T007's comparator.
  - **Run**: quickstart §3
- [ ] T012 [US2] `aletheia-stats` turns a free-form question into `card list` filters, or says none answers, in `.claude/skills/aletheia-stats/SKILL.md`
  - **Test**: `stats-skill.test.ts`: `006-US2-AS4 aletheia-stats answers a free-form question with the tree or card list filters, and says so when none answers`. The text contains `aletheia card list`, `--weak`, `--gaps`, `--not-reviewed 30`, `--sort failures --desc` and `no query answers`.
  - **Code**: section 2, "Which cards": "¿qué tengo flojo de <tema>?" is `card list <tags> --weak --sort failures --desc`; "¿qué no repaso hace un mes?" is `card list --not-reviewed 30`; "¿dónde tengo huecos?" is `card list --gaps`. Quote each card by its id and stored question. When no query answers ("¿qué tarjeta me costó más tiempo?"), say the CLI does not keep that, without estimating it.
  - **Run**: `pnpm test -t 006-US2-AS4`

**Checkpoint**: every id of US2 has its test.

---

## Phase 6: Step 4 — How the reviews went (US3)

**Goal**: "¿qué fallé esta semana?" and "¿cuántos repasos anulaste por reformulación?" are read
from the log.

**Independent Test**: quickstart §4.

- [ ] T013 [US3] `review history [tags...] [--days <n>]` gives the window's reviews, newest first, and their counts, in `src/core/progress/progress.ts` and `src/shell/cli/commands/review-history/review-history.ts`
  - **Test**:
    - `progress.test.ts`, through `reviewHistory(input, filters)`: reviews at or after `windowStart` only, newest first; `counts.reviews`, `counts.grades` (`again`, `hard`, `good`, `easy`, zeros included), `counts.flags` (one per `REVIEW_FLAGS` value, zeros included) and `counts.disputed` (`grade ≠ claudeGrade`) over them.
    - `src/shell/cli/commands/review-history/review-history.test.ts`:
      - `006-US3-AS1 review history gives the reviews of the last N days newest first, with card, instant, grades, flag and question as asked, and their counts`: reviews today, 3 days ago and 10 days ago; `--days 7 --json` gives the first two; `askedQuestion` is `null` on one inserted without it. `rowCounts` unchanged.
      - The default window is 7 days; `--days 0` exits 1 with `error: invalid options: --days: must be a whole number, 1 or more`.
      - `review history prints the counts and reviews as TOON` (decision 3).
    - `performance.test.ts`: `SC-003 review history answers in under 1 second on 1,000 cards and 20,000 reviews`.
  - **Code**: `reviewHistory` returns `{ counts, reviews }`, each entry `card`, `reviewedAt`, `grade`, `claudeGrade`, `flag`, `askedQuestion`. `review-history.ts`: group `review`, name `history`, `[tags...]` through `topicFrom` (reviews of cards in scope), `--days <n>` with `DEFAULT_HISTORY_DAYS = 7` in `review-history.constants.ts`. Registered after `reviewGradeCommand`.
  - **Run**: quickstart §4, the first command
- [ ] T014 [US3] `review history --grade <grade> --flag <flag>` narrows the reviews and their counts, in `src/core/progress/progress.ts`
  - **Test**: `review-history.test.ts`: `006-US3-AS1 review history with a grade or a flag gives only those reviews, and counts over them`: `--grade again` and `--flag badly-rephrased`, each with `counts.reviews` equal to the entries. `--grade nope` → `error: invalid options: --grade: must be again, hard, good or easy`; `--flag nope` → `error: invalid options: --flag: must be missing-prerequisite, badly-written or badly-rephrased`; both broken → both messages, joined by `; `, in the contract's order.
  - **Code**: `review-history.schema.ts` validates `grade` against `GRADES` and `flag` against `REVIEW_FLAGS` with `oneOf`; filters apply before the counts.
  - **Run**: quickstart §4
- [ ] T015 [US3] `aletheia-stats` answers questions about past reviews from the history, quoting its counts, in `.claude/skills/aletheia-stats/SKILL.md`
  - **Test**: `stats-skill.test.ts`: `006-US3-AS2 aletheia-stats answers questions about past reviews from aletheia review history and quotes its counts`. The text contains `aletheia review history`, `--days 7`, `--days 14`, `--grade again`, `--flag badly-rephrased`, `disputed` and `quote the counts`.
  - **Code**: section 3, "How the reviews went": "¿qué fallé esta semana?" is `review history --days 7 --grade again`, each Again with the question as asked; "¿cuántos repasos anulaste por reformulación estas dos semanas?" is `review history --days 14 --flag badly-rephrased` with `counts.reviews` out of the unfiltered `counts.reviews`; "¿en cuántos te discutí la nota?" is `disputed`. Quote the counts the CLI prints; never count rows yourself.
  - **Run**: `pnpm test -t 006-US3-AS2`

**Checkpoint**: every id of spec 006 has its test; `tests/traceability` is green.

---

## Phase 7: Close

- [ ] T016 Close the slice's docs
  - In `CLAUDE.md` Commands, add `tag stats`, `card list` and `review history` with their flags (`--sort`, `--desc`, `--weak`, `--gaps`, `--not-reviewed`, `--days`, `--grade`, `--flag`), and `specs/006-progress/contracts/cli.md` to the contracts list. In Workflow's skills bullet, add `aletheia-stats` (local) beside `aletheia-review`.
  - The contract takes the TOON and messages the tests fixed (decision 3).
  - Run quickstart §1 to §4 in `test` through `pnpm aletheia`.
  - `pnpm check` is green, traceability included.
  - Commit `docs: close slice 6 tasks`.
- [ ] T017 Hand off
  - Angelo merges `006-progress` into `main` and runs `pnpm release` from a clean `main`. Give him the commands and run neither.
  - No migration: the release changes no store.
  - Then quickstart §5 in `prod`, and the Measures of `specs/006-progress/quickstart.md` after two weeks (SC-002, SC-004).

---

## Dependencies & Execution Order

- T001 comes first.
- US1: T002 → T003 → T004 → T005; then T006 → T007 → T008. T005 and T008 share `SKILL.md`.
- US2: T009 needs T004 (the per-card facts), T006 (`topicFrom` moved) and T007 (`Flags` and
  the comparator). T009 → T010 → T011 → T012.
- US3: T013 needs T004, T006 and T007. T013 → T014 → T015.
- T016 needs all of them, and T017 needs T016.

## Parallel Opportunities

- T005 (skill file and its test) shares no file with T006; they can run side by side once T004
  is green.
- After T011, US3's CLI tasks (T013, T014) and T012 share no file.
- The skill tasks (T005, T008, T012, T015) share `SKILL.md` and `stats-skill.test.ts`; run them
  in order.
- Every core task touches `src/core/progress/progress.ts`; none of them runs in parallel with
  another.

## Implementation Strategy

1. **MVP**: Phase 3 (T002–T005). After a merge and a release, "¿cómo voy?" and "¿qué tengo
   flojo?" get the tree in `prod`.
2. **Then** Phase 4 (filter and sort), Phase 5 (cards) and Phase 6 (history). Phase 6 is P3:
   if the first three phases take the two days, it moves to a slice of its own (plan,
   Constitution Check V), and SC-004 moves with it.
3. Commit after every green task on `006-progress`. Run `pnpm check` before closing each task,
   with the traceability exception of decision 2.
