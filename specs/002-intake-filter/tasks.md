---

description: "Task list for 002-intake-filter"
---

# Tasks: Intake Filter

**Input**: Design documents from `specs/002-intake-filter/` (plan.md, spec.md, research.md, data-model.md, contracts/cli.md, quickstart.md), constitution 1.6.0, ADRs 0001–0015

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Mandatory (Constitution IV). Every behavior task starts with its failing tests, named
by the scenario id they cover (`002-USx-ASy`). Watch them fail, write the minimum code, refactor.
Tests drive the public interface: `main(argv, context)` through `runOnStore` and
`cliOnTempStore`, the exported functions of `src/core` and `src/shell/db`, the skill files on
disk, and `git check-ignore`.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs; each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 duplicates flagged, US2 junk flagged by the profile, US3 profile kept current
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

Slices 0 and 1's, unchanged: `src/core/<concept>/` and `src/shell/<adapter>/<concept>/`, one
folder per module with `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`, `<name>.errors.ts`,
`<name>.constants.ts` and `<name>.schema.ts`, each only when needed (ADR-0007); units import
each other through `#core/*` and `#shell/*`, one `index.ts` per unit (ADR-0004); only
`src/shell/db` knows SQLite, FTS5 and Drizzle (ADR-0010). Every failure named by its message is
an error class in its module's `.errors.ts`, without the `error: ` prefix the CLI edge adds. No
comments (`local/no-comments`); no call taking a call taking a call (`local/no-nested-calls`).

Shared by the CLI tests of this slice:

- a temp store per test from `cliOnTempStore({ clock })` (`tests/support/run-cli/run-cli.ts`),
  which runs the shipped migrations; cards go in through `card add` with JSON built from
  `SAMPLE_DRAFT` (`tests/support/cards/cards.constants.ts`) with fields overridden;
- ids from the counting draw: the first card of a run is `0123`, then `4567`, `89ab`, `cdef`,
  `ghjk`, `mnpq`;
- searches through `run(['card', 'search', '--json'], JSON.stringify(query))`.

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is already closed (T001).** ADRs 0014 and 0015 were accepted and constitution
   1.6.0 applied on 2026-11-10, before these tasks.
2. **The traceability test stays red until T011.** Spec 002 defines 10 ids with no test yet.
   A task closes with every check green except `tests/traceability`, whose list of missing ids
   shrinks by exactly the ids the task names. No test is changed for this (as in slice 1).
3. **The input contract lands whole in T004**, tags validated included, although tags only
   change the results from T006. One schema, written once.
4. **The backfill is appended to the unreleased custom migration in T005**, so 002-US1-AS6
   fails first. Editing a migration is safe until `pnpm release` ships it.
5. **An empty search is its own error class**, checked after parsing, not a zod root `refine`:
   `fieldMessages` would print it as `: give words, tags or both`.
6. **The profile test only asks git** (`git check-ignore`), and the skill tests read only the
   skill files: no test reads or writes `PROFILE.md` (INV-01's spirit, plan Constraints).

---

## Phase 1: Setup (gate)

- [X] T001 Gate: ADRs 0014 and 0015 accepted in `docs/adr/` and `docs/adr/README.md`; constitution 1.6.0 in `.specify/memory/constitution.md`; design §5, §8.1, §9 in `docs/design/2026-11-08-aletheia-design.md` (commits `c5c48bf`, `01af875`, `6a5ce4e`)

---

## Phase 2: Foundational

Intentionally empty. Every module, port method and migration lands with the first task that
needs it.

---

## Phase 3: Step 1 — Search by words (US1) 🎯 first stop

**Goal**: `card search` finds the active cards that share words with a text, singular for
plural, accents and case aside, whatever characters the text holds, including cards saved before
the slice.

**Independent Test**: quickstart §1 without tags: `pnpm aletheia card search <<'JSON'
{ "words": "contenedor" } JSON` lists the Docker card.

- [X] T002 [US1] Search terms from words, in `src/core/similar/similar.ts`
  - **Test**: `src/core/similar/similar.test.ts`, over `searchTerms(words: string): string[]`:
    - `searchTerms folds accents and case` — `'Configuración'` → `['configuracion']`; `'ÑANDÚ'` → `['nandu']`.
    - `searchTerms splits on anything but letters and digits` — ``'¿Qué es "redis" (y `*` -a : NOT)?'`` → `['redi', 'not']`; `'docker-compose up'` → `['docker', 'compose', 'up']`; `'[1, 10, 2].sort()'` → `['10', 'sort']`.
    - `searchTerms drops one-character and common words` — `'¿Qué diferencia hay entre el ps y el top?'` → `['ps', 'top']`; `'What is the event loop'` → `['event', 'loop']`.
    - `searchTerms makes plurals singular` — `'consumidores'` → `['consumidor']`; `'mensajes'` → `['mensaj']`; `'redis'` → `['redi']`; `'procesos'` → `['proceso']`; `'ps'` → `['ps']`; `'gas'` → `['gas']`.
    - `searchTerms keeps each term once, in first-seen order` — `'Docker docker DOCKER ps'` → `['docker', 'ps']`.
  - **Code**: `src/core/similar/` (`index.ts`, `similar.ts`, `similar.constants.ts`). `searchTerms`: NFD, drop `\p{M}`, lowercase, split on `/[^a-z0-9]+/`, drop words of one character, drop a word in `COMMON_WORDS` (checked on the folded word, before the singular rule), apply `singular`, keep the first of repeats. `singular(word)`: five characters or more ending in `es` → drop `es`; else four or more ending in `s` → drop `s`; else unchanged. `COMMON_WORDS`, a `ReadonlySet<string>` of folded words:
    - Spanish: `a al algo algun alguna alguno algunos ante antes aqui asi cada como con contra cual cuales cuando cuanto de del desde donde durante e el ella ellas ello ellos en entre era eran es esa esas ese eso esos esta estan estar estas este esto estos fue fueron ha han hasta hay la las le les lo los mas me mi mis muy ni no nos o otra otras otro otros para pero poco por porque puede pueden que quien se sea segun ser si sin sobre son su sus tambien tan te tiene tienen todo todos tu u un una unas uno unos y ya`
    - framing words of design §7: `diferencia diferencias funciona hace pasa significa sirve usa`
    - English: `an and are as at be by do does for from how if in into is it its of on or that the this to was what when where which who why with`
  - **Run**: `pnpm test src/core/similar`
- [X] T003 [US1] `card search` lists the cards sharing words, most relevant first, at most 10, in `src/shell/cli/commands/card-search/card-search.ts`
  - **Test**:
    - `src/shell/db/cards/cards.test.ts`, over a store from `openTestStore(path)`: `matching returns the active cards holding a term as a prefix, most relevant first` — three cards saved with `saveAll` (one whose question says `docker docker ps`, one saying only `docker`, one with neither); `matching(['docker', 'ps'])` → the first two, in that order; `matching([])` → `[]`.
    - `src/shell/cli/commands/card-search/card-search.test.ts`: `002-US1-AS2 card search finds a card that differs only in case, accents or singular and plural` — cards whose questions hold `consumidores` and `configuración`; `{ "words": "Consumidor" }` and `{ "words": "configuracion" }` each list their card; `{ "words": "contenedor" }` lists the `SAMPLE_DRAFT` card (its answer says `contenedores`). `002-US1-AS3 card search lists only the 10 most similar` — twelve `SAMPLE_DRAFT` cards; `{ "words": "docker" }` lists 10. A third test: without `--json`, one `SAMPLE_DRAFT` card prints exactly the TOON block of `contracts/cli.md` with id `0123`.
  - **Code**:
    - `pnpm exec drizzle-kit generate --custom --name card_search`; its `migration.sql`, read before committing:
      ```sql
      CREATE VIRTUAL TABLE `card_search` USING fts5(card_id UNINDEXED, question, answer, key_points, situation, tokenize = 'unicode61 remove_diacritics 2');
      --> statement-breakpoint
      CREATE TRIGGER `card_search_on_insert` AFTER INSERT ON `cards`
      BEGIN
      	INSERT INTO card_search (card_id, question, answer, key_points, situation) VALUES (new.id, new.question, new.answer, new.key_points, new.situation);
      END;
      ```
    - `src/core/cards/cards.types.ts`: `CardRepository` gains `matching(terms: string[]): Card[]`.
    - `src/shell/db/cards/cards.ts`: `StoreCardRepository.matching` returns `[]` for no terms; otherwise writes each term as `"<term>"*`, joins them with ` OR `, and runs ``this.#db.all<{ id: string }>(sql`select c.id from card_search s join cards c on c.id = s.card_id where card_search match ${query} and c.status = ${ACTIVE_STATUS} order by s.rank`)``, then maps the ids to cards with their tags, keeping the order.
    - `src/core/similar/similar.ts`: `similarCards(matches: Card[]): Card[]`, the first `SIMILAR_CARDS_LIMIT` (`10`, in `similar.constants.ts`); export `searchTerms`, `similarCards` and `SIMILAR_CARDS_LIMIT` from `src/core/similar/index.ts`.
    - `src/shell/cli/commands/card-search/`: `card-search.schema.ts` with `searchSchema = z.strictObject({ words: z.string() })` (the shape only; T004 completes it); `card-search.ts` with `cardSearchCommand` (`group: 'card'`, `name: 'search'`, "list the active cards most similar to the words and tags given as JSON on stdin"), which parses `readJson(context)` inside `withStore`, then `searchTerms` → `repository.matching` → `similarCards`, and returns `{ cards }` with `id`, `type`, `tags`, `question`, `answer` per card. Register it in `COMMANDS` in `src/shell/cli/main/main.ts`, after `cardShowCommand`.
  - **Run**: `pnpm aletheia card search <<'JSON'` / `{ "words": "contenedor" }` / `JSON`
- [X] T004 [US1] `card search` takes any text literally and refuses an empty or malformed search, in `src/shell/cli/commands/card-search/card-search.schema.ts`
  - **Test**: `card-search.test.ts`: `002-US1-AS4 card search takes quotes, backticks, operators and code as plain text` — with the `SAMPLE_DRAFT` card saved, each of ``'`docker` "ps" (NOT -a) *'``, `'ps AND OR NEAR(x y)'`, `'a:b ^c "unterminated'` and a fenced JavaScript snippet exits 0 with valid JSON on stdout; the first lists the card. `002-US1-AS5 card search with nothing similar prints an empty list and succeeds` — `{ "words": "kubernetes" }` → exit 0, TOON stdout `cards: []\n`; `{ "words": "¿qué es esto?" }` → `cards: []\n`. `002-US1-AS5 card search refuses a search with neither words nor tags` — `{}`, `{ "words": "   " }` and `{ "tags": [] }` each exit 1, stdout empty, stderr ending `error: invalid search: give words, tags or both\n`. `002-US1-AS5 card search refuses a malformed tag or an unknown field` — `{ "tags": ["Docker"] }` → `error: invalid search: tags[0]: use a-z, digits and dashes, in segments joined by ::\n`; `{ "words": "x", "limit": 5 }` → `error: invalid search: limit: is not a search field\n`; `{ "words": 3 }` → `error: invalid search: words: must be text\n`; `{ "tags": "docker" }` → `error: invalid search: tags: must be a list\n`.
  - **Code**: `searchSchema = z.strictObject({ words: z.string({ error: 'must be text' }).optional(), tags: z.array(z.string().regex(TAG_PATTERN, MALFORMED_TAG), { error: 'must be a list' }).optional() })`, with `MALFORMED_TAG` imported from `../card-add/card-add.constants.ts`; `card-search.constants.ts`: `NOT_A_SEARCH_FIELD = 'is not a search field'`, `MUST_BE_TEXT`, `MUST_BE_A_LIST`, `EMPTY_SEARCH = 'give words, tags or both'`; `card-search.errors.ts`: `InvalidSearchError(issues)` → `invalid search: <fieldMessages(issues, NOT_A_SEARCH_FIELD)>` and `EmptySearchError` → `invalid search: give words, tags or both`, thrown when the words are blank or missing and there are no tags. Words of common words only, with no tags, search nothing and print `cards: []`.
  - **Run**: quickstart §1, the refusals
- [X] T005 [US1] Cards saved before the slice are searchable once the store migrates, in `migrations/<timestamp>_card_search/migration.sql`
  - **Test**: `card-search.test.ts`: `002-US1-AS6 card search finds cards saved before the search migration` — copy `SHIPPED_MIGRATIONS` into a `tempDir` without the `*_card_search` folder; run `card add` with the `SAMPLE_DRAFT` card on a temp store with `migrationsDir` set to that copy; then run `card search` with `{ "words": "docker" }` on the same store with the shipped folder → stderr reports the `card_search` migration as applied, stdout lists `0123`. `002-US1-AS6 card search finds a card as soon as it is saved` — `card add`, then `card search` in the next call, lists it.
  - **Code**: append to the custom migration, after the trigger:
    ```sql
    --> statement-breakpoint
    INSERT INTO card_search (card_id, question, answer, key_points, situation) SELECT id, question, answer, key_points, situation FROM cards;
    ```
  - **Run**: `pnpm test -t 002-US1-AS6`

**Checkpoint**: `card search` answers quickstart §1 for words.

---

## Phase 4: Step 2 — Tags join the search (US1)

**Goal**: cards sharing a tag family come with the word matches, in the spec's three groups.

**Independent Test**: quickstart §1 with `"tags": ["docker"]`.

- [X] T006 [US1] `card search` orders word matches sharing a tag family, other word matches, then cards sharing only a tag family, in `src/core/similar/similar.ts`
  - **Test**:
    - `similar.test.ts`: `sharesTagFamily matches the same tag, an ancestor or a descendant` — `['messaging::redis-streams']` against `['messaging::redis-streams']`, `['messaging']` and `['messaging::redis-streams::pel']` → true; against `['messaging::rabbitmq']`, `['docker']` and `['messaging-queues']` → false; `['docker']` against `['docker-compose']` → false. `similarCards orders the three groups and keeps 10` — over `Card` objects built in the test: word matches `[B, A]` (A shares a family, B does not), active `[A, B, C, D]` (C shares only a family, D nothing), tags `['docker']` → `[A, B, C]`; two cards sharing only a family come newest first by `createdAt`; a card both matched and in the family appears once; twelve candidates → 10.
    - `card-search.test.ts`: `002-US1-AS1 card search lists cards sharing words and a tag, then words, then only a tag family` — card A: question `¿Cómo confirma un consumidor un mensaje en Redis Streams?`, tag `messaging::redis-streams`; card B: the same question, tag `databases::postgres`; card C: question `¿Qué guarda la PEL?`, tag `messaging`; card D: question `¿Qué hace git rebase?`, tag `git`. `{ "words": "consumidor mensaje Redis Streams", "tags": ["messaging::redis-streams"] }` lists `0123`, `4567`, `89ab` in that order, each with `id`, `type`, `tags`, `question`, `answer`, and not `cdef`.
  - **Code**: `sharesTagFamily(cardTags: string[], searchTags: string[]): boolean` — some pair where `a === b`, `a.startsWith(`${b}::`)` or `b.startsWith(`${a}::`)` (`TAG_SEPARATOR = '::'` in `similar.constants.ts`). `similarCards(matches, active, tags)`: matches sharing a family (in match order), matches not sharing one, then active cards outside the matches sharing a family, newest `createdAt` first; the first 10. `cardSearchCommand` passes `repository.active()` and the parsed tags (empty when missing).
  - **Run**: quickstart §1 with tags

**Checkpoint**: the search contract of `contracts/cli.md` holds whole.

---

## Phase 5: Step 3 — Capture flags duplicates (US1)

**Goal**: `az-aletheia-add` searches every draft before showing any and flags a repeat.

**Independent Test**: `pnpm test -t 002-US1-AS7`; for real after the release (quickstart §2).

- [X] T007 [US1] `az-aletheia-add` searches every draft and flags duplicates and overlaps, in `skills/az-aletheia-add/SKILL.md`
  - **Test**: `tests/skills/add-skill.test.ts`: `002-US1-AS7 az-aletheia-add searches every draft before showing any and flags a repeat` — the text contains `aletheia card search`, `synonyms`, `duplica a #`, `se solapa con #`; it still passes 001-US1-AS6 (no `DEVELOPMENT_ONLY` string).
  - **Code**: a new section between "1. Draft" and "2. Show every draft", "Search for similar cards": for each draft, one `aletheia card search <<'JSON' … JSON` whose `words` are the draft's question and answer plus synonyms and the technical terms in Spanish and English (`detenidos stopped exited --all` for `docker ps -a`) and whose `tags` are the draft's; read every listed card; a draft that says what a card says is flagged `⚠ duplica a #<id>`; one that repeats part of a card and adds something, `⚠ se solapa con #<id>: <qué repite>; agrega <qué es nuevo>`; drafts of the same batch that repeat each other are merged or one is dropped before showing. In "2. Show every draft": a flagged draft carries its flag on the line after its header and is shown with the rest, never dropped silently; Angelo decides as with any draft; the flag is not stored. Replacing or merging an old card is not offered (slice 6). Every question about existing cards runs `aletheia card search` or `aletheia card show`.
  - **Run**: `pnpm test -t 002-US1-AS7`

**Checkpoint (MVP)**: US1 is complete; after a release, duplicates are flagged at capture.

---

## Phase 6: Step 4 — The profile flags junk (US2)

**Goal**: an untracked profile exists, and the add skill reads it and flags junk.

**Independent Test**: `git check-ignore PROFILE.md` succeeds; `pnpm test -t 002-US2`.

- [ ] T008 [P] [US2] Git ignores `PROFILE.md` at the repo root, in `.gitignore`
  - **Test**: `tests/skills/profile.test.ts`: `002-US2-AS2 git ignores PROFILE.md at the repo root` — `execFileSync('git', ['check-ignore', '-q', 'PROFILE.md'], { cwd: REPO_ROOT })` does not throw, and the same call for `skills/PROFILE.md` throws (only the root file is ignored). The file need not exist.
  - **Code**: `.gitignore` gains `/PROFILE.md`.
  - **Run**: `git check-ignore -v PROFILE.md`
- [ ] T009 [US2] Write the first profile with Angelo, in `PROFILE.md` (no test: content judged by Angelo, named exception)
  - Draft in Spanish from design §5, one bullet per area, in the format of `data-model.md`: frontend very strong, with its basics counted as already known; backend, working knowledge; AWS, studying it (AWS Commit Academy). Ask Angelo whether "heading toward full-stack with weight on cloud" holds before writing it. Write the file only with his approval; `git status` must not list it. Nothing to commit.
- [ ] T010 [US2] `az-aletheia-add` reads the profile and flags trivia, the already known and a weak situation, in `skills/az-aletheia-add/SKILL.md`
  - **Test**: `tests/skills/add-skill.test.ts`: `002-US2-AS1 az-aletheia-add reads the profile before drafting and flags junk with its reason` — the text contains `~/me/aletheia/PROFILE.md`, `trivia`, `ya lo sabes por tu perfil`, `sin situación creíble`.
  - **Code**: a step 0, "Read the profile": read `~/me/aletheia/PROFILE.md` before drafting, as context for usefulness, not a whitelist; if it cannot be read, say so in one line and draft without it, flagging nothing as already known. In "1. Draft": the rules gain 6, not already known (judged against the profile and the similar cards), and 7, no duplicate (the search); rules 1–3 (shape) are fixed before showing, by splitting, shortening or rephrasing; rules 4–7 (worth) are flagged, never dropped: `⚠ trivia: <por qué>`, `⚠ ya lo sabes por tu perfil: <qué línea>`, `⚠ sin situación creíble: <por qué>`.
  - **Run**: `pnpm test -t 002-US2-AS1`

**Checkpoint**: US2 is complete; after a release, junk is flagged at capture.

---

## Phase 7: Step 5 — The profile kept current (US3)

**Goal**: while a capture or a review runs, Claude offers a profile change the moment Angelo
states his level, and writes it only if he approves.

**Independent Test**: a review in this repo (its skill loads from the working tree): mention
"uso Terraform a diario" and see the offer at the end of Claude's next reply (quickstart §4).

- [ ] T011 [US3] Both skills offer a profile change when Angelo states his level, in `skills/az-aletheia-add/SKILL.md` and `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `tests/skills/profile.test.ts`: `002-US3-AS1 both skills offer a profile change and write it only after Angelo approves` — for each of the two skill files: the text contains `~/me/aletheia/PROFILE.md`, `¿Anoto en tu perfil`, `¿Cambio en tu perfil` and `only after Angelo approves`; neither description gains a trigger (001-US1-AS6 and 001-US2-AS7 still pass).
  - **Code**: in both skills, a section "Keep the profile current": only while this skill runs; only explicit statements of his level ("uso Terraform a diario", "nunca he tocado Kubernetes", a draft rejected with "eso ya lo sé"), never a grade, a streak or a guess; the offer is the last line of Claude's next reply, without stopping the question, the grade or the drafts: `¿Anoto en tu perfil: «<línea>»?`, or `¿Cambio en tu perfil «<antes>» por «<después>»?` when a line already covers that area; the file is `~/me/aletheia/PROFILE.md`, edited only after Angelo approves that exact line; an offer he ignores is dropped and not repeated.
  - **Run**: quickstart §4, first half, in this repo

**Checkpoint**: every id of spec 002 has its test; `tests/traceability` is green.

---

## Phase 8: Close

- [ ] T012 Update `CLAUDE.md` (Commands: `card search` reads JSON on stdin; Data: `PROFILE.md` is untracked and edited by the skills only with Angelo's approval) and `contracts/cli.md` with any message a task changed; `pnpm check` green, traceability included; commit `docs: close slice 2 tasks`
- [ ] T013 Hand off: Angelo merges `002-intake-filter` into `main` and runs `pnpm release` from a clean `main` (give him the commands, run neither); then quickstart §2 to §4 in `prod`, and the Measures table of `specs/002-intake-filter/quickstart.md` after two weeks (SC-002)

---

## Dependencies & Execution Order

- T001 done. T002 → T003 → T004 → T005 → T006 → T007 (the search, then the skill that calls it).
- T008 has no dependency and can run any time. T009 needs T008 (the file must be ignored before
  it exists). T010 needs T007 (same skill file) and T009 (Angelo exercises it with a profile).
- T011 needs T010 (same skill file). T012 needs all; T013 needs T012.
- Stories: US1 (T002–T007) stands alone and is the MVP; US2 (T008–T010) builds on US1's skill
  section; US3 (T011) builds on US2's profile.

## Parallel Opportunities

- T008 [P] beside any task of Phases 3–5: it touches only `.gitignore` and a new test file.
- Inside a task, the unit tests of `src/core/similar` and the CLI tests can be written side by
  side; the code still lands in the order above.

## Implementation Strategy

1. **MVP**: Phases 3–5 (US1). After a merge and a release, duplicates are flagged in `prod`.
2. **Then** Phase 6 (US2) and Phase 7 (US3): skill text and one ignored file, no new code
   beyond the `.gitignore` line.
3. Commit after every green task on `002-intake-filter`; `pnpm check` before closing each task,
   with the traceability exception of decision 2.
