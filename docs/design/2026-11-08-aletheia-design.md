# Aletheia — Design

Date: 2026-11-08
Status: draft, pending approval

Aletheia (ἀλήθεια, "truth", literally _a-lēthē_, "not-forgetting") is a personal
spaced-repetition flashcard system operated through Claude Code.

## 1. Intent

Angelo studies technical topics across many projects (Redis Streams, Redis vs
RabbitMQ, Docker commands, terms from the algorithms project, AWS through AWS
Commit Academy). Much of that study happens in Claude Code sessions, and what is
learned fades. Aletheia turns the valuable parts of those sessions into
flashcards and schedules them with spaced repetition so they stick.

The defining concern is **quality over volume**. Angelo does not want a deck
that fills up with junk. Two kinds of junk matter:

1. Cards he already knows by heart and that add nothing.
2. Cards that are not useful: no credible situation where knowing them matters.

Every flow (adding, reviewing, pruning) exists partly to keep junk out or get it
out.

## 2. Goals, non-goals, anti-goals

**Goals**

- Capture cards from any Claude Code session, in any repo, through one global skill.
- Review in the terminal through Claude: Claude asks, Angelo answers in his own
  words, Claude grades.
- Schedule with a modern, proven algorithm (FSRS).
- Show progress by hierarchical tag: retention, due, weak topics, topics with gaps.
- Filter at entry (quality rules + usefulness test + Angelo's approval) and at
  exit (pruning with archive-with-reason).
- Let reviews feed the deck: a failed review caused by a missing prerequisite
  proposes the missing card.

**Non-goals (v1)**

- TUI or web UI. The core must allow one later without rework.
- Vector database, embeddings, RAG.
- Multi-device sync or a hosted database. Postgres on AWS stays possible later.
- Images, audio, complex diagrams on cards (ASCII is fine).
- Prerequisite relations between cards ("requires"). Noted as a future idea.
- Studying a topic from scratch inside a review session.

**Anti-goals (failure even if it technically works)**

- A deck full of trivia, duplicates, or things Angelo already knows.
- Cards that cannot be understood without the conversation they came from.
- Cards so broad they ask for an essay, or so atomic they are answerable
  without understanding.
- Anything that saves or deletes cards without Angelo's approval.
- Deleting cards. Retired cards are archived with a reason, never deleted.

## 3. Constraints

- **Language:** all code, specs, plans, skill files and docs in English. Card
  content in Spanish, with technical terms kept in English. Claude talks to
  Angelo in Spanish.
- **Primary interface is Claude Code.** The CLI is consumed by Claude, not typed
  by a human. It needs discoverable `--help` and machine-friendly output.
- **Skills never touch the database.** Every read and write goes through the CLI
  (same rule as diarium).
- **Approval:** Claude proposes, Angelo decides. Applies to adding, rewriting,
  splitting, merging, archiving and grade disputes.
- **Code style (from Angelo's standing preferences):** test-first, tests through
  the public interface (the CLI), no code comments (self-documenting code),
  prefer proven libraries over hand-rolled code.

## 4. Decided by Angelo

- Name: **Aletheia**.
- **Repository pattern** hides the database API. Nothing outside the repository
  layer knows which engine is used.
- Start local; Postgres (possibly deployed on AWS) may come later behind a new
  repository adapter.
- Stack: TypeScript, zod, Drizzle ORM + drizzle-kit, oxlint, oxfmt, knip, jscpd.
- **Only the add skill is global**, named `az-aletheia-add`. Review, stats and
  prune are **project-local skills** in the Aletheia repo; to review, Angelo opens
  Claude Code in the repo.
- Claude **proposes cards, Angelo approves** them before anything is saved.
- **Claude grades** reviews based on Angelo's free-form answer.
- **Card granularity:** balanced. One idea or mechanism per card, not a single
  word and not a whole topic (see §6).
- **Questions are self-contained:** they carry all the context needed to be
  understood.
- **Usefulness test:** a card enters only if Claude can name a credible
  situation where knowing it matters.
- **Gap-driven growth:** when a review fails because a prerequisite concept is
  missing, Claude proposes the prerequisite card (the system feeds itself).
- **Archive, never delete.** Every archived card stores why it was archived.
- Card content in Spanish with technical terms in English; code and specs in English.
- Review sessions can target a specific topic (tag).

## 5. Domain

**Card**

| Field            | Notes                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| id               | stable identifier, short enough to quote in chat                       |
| type             | one of the templates in §7                                             |
| question         | self-contained prompt, Spanish                                         |
| answer           | full answer shown after grading, 1–3 lines                             |
| key points       | 1–3 tightly coupled points; the grading rubric                         |
| situation        | the credible situation where knowing this matters                      |
| tags             | one or more hierarchical tags, e.g. `mensajeria::redis-streams`        |
| source           | where it was captured (repo or study context) — _my call_              |
| status           | `active` or `archived`                                                 |
| archive reason   | required when archived                                                 |
| replaced by      | optional link when archived because a new card replaces it — _my call_ |
| scheduling state | FSRS state as defined by `ts-fsrs`                                     |
| timestamps       | created, updated, archived                                             |

**Tags** are hierarchical with `::` as separator (Anki convention). Filtering by
a tag includes all descendants: `mensajeria` covers `mensajeria::rabbitmq`.
A card may carry several tags (a Redis-vs-RabbitMQ card lives under both).

**Review log** (one row per graded review): card, rating, timestamp, Angelo's
answer, Claude's grading rationale, whether the grade was changed after a
dispute, and flags: `missing-prerequisite`, `badly-written`. — _Storing the
answer, rationale and flags is my call; they power stats and pruning._

A review flagged `badly-written` is **voided**: it is logged, but it does not
update FSRS and does not count toward retention or leech detection, because it
says nothing about Angelo's memory. — _my call_

**Prune decision** (one row per "keep" chosen during pruning): card, candidate
reason, date. Used so kept cards are not proposed again without new evidence
(§8.4). — _my call_

**Profile**: a `PROFILE.md` in the repo that the add and prune skills always
read, as context for judging usefulness (not a whitelist of topics). Initial
content:

- Very strong frontend; working backend knowledge; studying AWS.
- _Guess, not stated:_ heading toward full-stack with weight on cloud.
- Frontend cards must be deep or non-obvious; basics count as "already known".

## 6. Card quality rules

Enforced by `az-aletheia-add` when drafting, and by prune when reviewing the deck.

1. **One idea or mechanism per card.** If the answer has an unrelated "and also",
   split it. Several points are allowed only when they are so tied that one
   makes no sense without the other.
2. **Answer fits in 1–3 lines.** Longer means it is not one idea yet.
3. **Self-contained question.** Names the technology and the variant when it
   matters ("a _classic_ RabbitMQ queue", because RabbitMQ Streams behave
   differently). No "this", "the earlier thing", "our project".
4. **Credible situation required.** If no believable situation where it matters
   can be named, the card does not enter (or is flagged as dubious).
5. **Not trivia.** No dates, versions, who-created-what, or things used once a
   year and found in seconds.
6. **Not already known.** Judged against the profile and existing cards.
7. **No duplicates.** Checked against existing cards before proposing.

Calibration examples (Spanish content, as stored):

- Too broad: "¿Qué es un consumer group en Redis Streams?"
- Too atomic: "En un consumer group, ¿cuántos consumidores reciben cada mensaje?" → "Uno."
- Balanced: "En Redis Streams, ¿cómo reparte un consumer group los mensajes entre
  sus consumidores, y qué tiene que hacer un consumidor para que Redis dé un
  mensaje por procesado?" → "Cada mensaje va a un solo consumidor. El consumidor
  confirma con `XACK`; hasta entonces el mensaje queda en la lista de pendientes (PEL)."
- Balanced: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?" →
  "`ps` muestra solo los contenedores en ejecución; `-a` incluye también los detenidos."

## 7. Card templates

Templates are drafting guides for the add skill (how to phrase each type, with
an example) and a `type` stored on the card. All follow §6.

| Type       | Shape                                                | What grading checks                                                |
| ---------- | ---------------------------------------------------- | ------------------------------------------------------------------ |
| concept    | how something works / what it guarantees             | key points present                                                 |
| comparison | X vs Y on one specific dimension                     | the criterion, not exact wording                                   |
| command    | which command or flag does a specific thing          | accepts equivalents (`docker ps -a` = `docker container ls --all`) |
| scenario   | given a concrete situation, what do you do           | the concept applied                                                |
| code       | read a short snippet: complexity, output, or the bug | result and reasoning                                               |

_The type list is my call, distilled from the conversation; cloze and
term↔definition were dropped because at the balanced granularity they tend to
become trivia._

## 8. Flows

### 8.1 Add — global skill `az-aletheia-add`

Triggered from any repo when Angelo says "guarda esto" or similar, or invokes it.

1. Claude reads `PROFILE.md` and drafts cards from the current conversation,
   following §6 and §7.
2. For each draft, Claude asks the CLI for similar existing cards (text search
   plus tags) and judges duplicates itself.
3. Claude presents the drafts: type, tags, question, answer, key points,
   situation. Dubious drafts are flagged with the reason ("trivia", "ya lo sabes
   por tu perfil", "duplica a #id", "sin situación creíble").
4. Angelo approves, edits or rejects each card.
5. Approved cards are saved through the CLI. Rejected drafts are not stored.

### 8.2 Review — local skill

1. Angelo asks for a review: general (cards due today) or by tag (tag plus descendants).
2. **Topic review ahead of schedule:** by tag, all active cards in the tag are
   eligible even if not due, and the review counts as a real review. FSRS
   handles early reviews (an early success grows the interval only a little).
3. Claude shows one question. Angelo answers in his own words.
4. Claude grades against the key points:
   - **Again:** did not know, or a fundamental error, or missing the base concept.
   - **Hard:** partial; an important key point is missing.
   - **Good:** all key points, essentially correct.
   - **Easy:** all key points, precise, and with no hedging ("creo que…",
     "¿era…?"). No timing signal is used: chat latency includes typing and
     Claude, so it would be noise. Angelo can claim Easy by disputing. — _my call_
5. Claude states the grade and why, then shows the full answer.
6. Angelo may dispute the grade; Claude adjusts before recording it.
7. The rating is recorded through the CLI; FSRS computes the next due date.
8. **Missing prerequisite** ("no recuerdo qué es un consumer group"): grade
   Again, explain the base concept in 2–3 lines (no lesson), then look for a card
   covering it. If one exists, pull it into this session. If not, propose it
   through the same rules and approval as §8.1. This Again is a real failure: it
   updates FSRS and counts toward retention, and the flag makes it count as a gap
   rather than toward leech detection. — _my call_
9. **Badly written card** (failed because of the wording, not the knowledge):
   the review is voided (§5) and Claude proposes a rewrite on the spot.
10. **Same-session relearning:** FSRS short-term scheduling stays on (the
    `ts-fsrs` default). A card that becomes due again during the session, such
    as one graded Again, is shown again before the session ends. Re-shows do not
    count toward the session cap. — _my call_
11. **Session cap:** about 20 cards, because every card passes through Claude
    and costs context. The cap is soft: when reached, Claude says how many
    remain and asks whether to continue. — _my call_
12. **New cards per day cap**, so a big capture session does not flood reviews.
    Default 10, configurable. It applies to general review only: topic review
    includes the tag's new cards without the cap, and cards pulled in as
    prerequisites or created by a rewrite, split or merge are exempt. All caps
    are enforced in the core. — _my call_

### 8.3 Stats — local skill

- Base view: hierarchical tag tree with card count, retention, due today,
  weak cards, gap count; sortable by any column; filterable by tag.
- "Weak" = cards failed repeatedly (leeches). "Gaps" = reviews flagged
  `missing-prerequisite`. A topic with gaps is different from a weak topic.
- Shows how many prune candidates exist among the ones the core can detect on
  its own (mastered and leech, §8.4).
- Free-form questions ("¿qué tengo flojo de mensajería?", "¿qué no repaso hace
  un mes?") are answered by Claude using the CLI's filterable queries. Views
  asked for often become commands later.

Illustrative shape (not a spec of columns or wording):

```
TEMA                     TARJETAS  ACIERTO  HOY  FLOJAS
algorithms               40        65%      9    8
  grafos                 15        58%      4    5
mensajeria               48        78%      6    5
  redis-streams          30        71%      5    4
  rabbitmq               18        89%      1    1
docker::comandos         25        93%      2    0
```

### 8.4 Prune — local skill

Run on demand. Claude lists candidates, each with its reason:

1. **Mastered:** FSRS predicts recall beyond about a year and recent reviews were Easy.
2. **No current situation:** the stored situation no longer applies to the profile.
3. **Problematic (leech):** failed repeatedly. Usually badly written or two ideas
   in one; the remedy is rewrite or split, not archive.
4. **Overlapping:** two cards asking nearly the same thing.

**Who detects what — my call:** mastered and leech are deterministic and
computed by the core. No-current-situation and overlapping need judgment, so
Claude finds them in the skill, reading the deck tag by tag through the CLI.

Per candidate Angelo chooses: archive, rewrite, split, merge, or keep. Archive
always stores the reason. Archived cards leave reviews and active stats but can
be restored. Prune never acts on its own.

**Keep persists — my call:** a kept card is not proposed again for the same
reason until there is new evidence. For a leech, that means new lapses after the
keep; for the other reasons, six months after the keep.

_Thresholds ("about a year", "failed repeatedly", six months) are my call and
should be configurable._

**Rewrites — my call:**

- An in-place edit keeps the card and its scheduling state. It is allowed when
  the card still asks for the same knowledge: clearer question, tidier answer,
  adjusted tags or situation.
- If the key points change meaning, it is a new card with fresh FSRS state, and
  the old one is archived with reason "replaced by #id".
- Split and merge produce new cards with fresh state. Angelo may have to relearn
  them, but FSRS spaces them out quickly when he grades Easy. They are exempt
  from the new-card cap.

## 9. Architecture

```
skills (Claude)  ──►  CLI (commander)  ──►  core (domain, FSRS, stats)  ──►  repositories  ──►  SQLite
 az-aletheia-add        TOON out              ts-fsrs                         interface        (node:sqlite
 review/stats/prune     JSON in (zod)                                          + adapter         via Drizzle)
```

- **Core:** cards, tags, review log, scheduling (`ts-fsrs`), session and
  new-card caps, stats, and deterministic prune candidates (mastered, leech). All logic lives here, not in skills, so a future TUI/UI
  reuses it.
- **Repositories:** interfaces owned by the core; one SQLite adapter in v1.
  A Postgres adapter is a later addition. Drizzle schemas are dialect-specific,
  which is exactly what the adapter boundary absorbs.
- **CLI:** the only entry point for skills.
  - **Output:** TOON by default (fewer tokens on uniform lists, which is most
    of what Claude reads); `--json` for debugging and scripts. — _proposed by me,
    agreed direction from Angelo's question_
  - **Input:** card creation and edits take JSON (stdin or argument), validated
    with zod. JSON because Claude writes it reliably and card content contains
    multi-line code.
  - Filterable, sortable queries over cards and stats, so Claude can answer
    free-form progress questions without new commands.
- **Search for duplicates:** SQLite FTS5 plus tags. No vectors in v1. If
  duplicates slip through at scale, `sqlite-vec` adds embeddings to the same file.

## 10. Stack

Angelo's: TypeScript, zod, Drizzle ORM, drizzle-kit, oxlint, oxfmt, knip, jscpd.

My calls, mirroring diarium where it applies:

- Node 26 with native TypeScript execution for development and tests, pnpm, vitest.
- SQLite through `node:sqlite` with Drizzle's `node-sqlite` driver (as diarium).
- `ts-fsrs` for scheduling.
- `commander` with `@commander-js/extra-typings` for the CLI (typed subcommands,
  generated `--help`).
- `@toon-format/toon` for TOON output.
- `rolldown` to bundle releases (spec 000, ADR-0005).

## 11. Layout and installation (my calls)

- Repo at `~/me/aletheia`.
- The installed `aletheia` keeps its database in `~/.aletheia/`, outside the repo, at a fixed
  path so the global skill works from any working directory; the sources keep theirs in the
  repo's `data/`, gitignored (ADR-0008). Separate database for tests.
- Installed bin `aletheia` on PATH: a release, built from `main` with `pnpm release`, packed
  and installed globally, so development in the repo never reaches it (spec 000).
- `az-aletheia-add` source lives in this repo and is symlinked into
  `~/.claude/skills/`, so the skill and the CLI it calls are versioned together.
  (Other `az-*` skills live in `~/dotfiles`; this one is coupled to the CLI.)
- Local skills in `.claude/skills/` of the repo.
- Backups of the database file to iCloud Drive, following diarium's approach.

## 12. Left to the builder

- Command names, flags and exact output fields of the CLI.
- Local skill names.
- Database schema details, indexes, migrations.
- How FTS5 is wired with Drizzle (virtual tables likely need raw SQL in a
  migration). Verify FTS5 is available in Node's bundled SQLite.
- Whether oxlint covers the rules diarium enforces with eslint (no comments,
  file naming, sonarjs-style checks), and how to fill any gaps.
- Retention formula and time window for stats; leech threshold; config storage.
- Card id format.
- Backup trigger (explicit command, before migrations, or both).

## 13. Process and slices

Approved 2026-11-08. The design is executed with GitHub Spec Kit, under a
constitution adapted from diarium's. Each slice, slice 0 included, goes through
`/speckit-specify` → `/speckit-clarify` → `/speckit-plan` → `/speckit-tasks` →
`/speckit-implement`, with a one-page spec. Every slice ends in something Angelo
can use.

| #   | Slice                                                                                                           | How Angelo exercises it                                      |
| --- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 0   | Skeleton: tooling, `aletheia` bin, SQLite + migrations, backup. Exception: shared setup, no card behavior       | `aletheia --help`, `aletheia backup`                         |
| 1   | Capture and review: `az-aletheia-add` proposes, Angelo approves; review asks, Claude grades, FSRS schedules     | add a card from another repo, review it in the Aletheia repo |
| 2   | Intake filter: profile, quality rules, duplicate search, dubious flags                                          | Claude flags junk and duplicates when proposing              |
| 3   | Topic review: hierarchical tags, ahead-of-schedule review, caps                                                 | "repasemos mensajería"                                       |
| 4   | Gaps and badly written cards in review: prerequisite card, voided review, rewrite                               | "no recuerdo qué es X"                                       |
| 5   | Progress: tag tree, retention, weak, gaps, sorting, free-form queries                                           | "¿qué tengo flojo?"                                          |
| 6   | Prune: candidates, archive with reason, restore, keep, replace, split, merge                                    | run the prune skill                                          |

## 14. Future, not v1

- Postgres adapter, possibly on AWS (RDS or a serverless option).
- `sqlite-vec` for semantic duplicate detection.
- TUI or web UI on top of the core.
- Prerequisite relations: cards that wait until their base card is solid.
- Claude rephrasing the question on each review so Angelo remembers the concept,
  not the wording. Raised, not decided.
