# Research: Progress

Decisions marked **Angelo** were his, in the spec's Clarifications. The command names and
options (R1, R2) are public interface: Angelo accepts them before step 1. Nothing here needs a
new dependency, a migration or an ADR: every number is derived in the core from the stored
cards and reviews (constitution II, VI).

## R1. Three read commands, each in the group of what it lists

- **Decision**: `aletheia tag stats [tags...]` gives the progress tree (US1), `aletheia card
  list [tags...]` the cards (US2), and `aletheia review history [tags...]` the reviews (US3).
  The tags work as in `review topic`: one or more, each with its descendants, a malformed one
  refused by `topicTagSchema`, and one with no active card under it refused with
  `no active card under <tags>` (`NoActiveCardUnderError`).
- **Rationale**: the CLI already reads as `<what> <verb>` (`tag list`, `card show`,
  `review due`), and each command lists the thing its group names. Claude finds them from
  `--help` under the group it already knows.
- **Alternatives**: a `stats` group (`stats tags`, `stats cards`, `stats reviews`: a second
  name for nouns that already have a group); stats columns on `tag list` (the review skill
  reads it to find a topic's tags, and would pay for six columns it never uses).

## R2. Options: filters as flags, one sort with a direction

- **Decision**:
  - `--sort <field>` takes the name of an output field, as printed (`retention`,
    `lastReview`), and `--desc` reverses it. `tag stats` sorts by `tag`, `cards`, `new`, `due`,
    `retention`, `weak` or `gaps`, by `tag` when none is given. `card list` sorts by `id`,
    `state`, `due`, `lastReview`, `failures` or `gaps`, by `lastReview` when none is given;
    `question` and `tags` are text, not something to rank by.
  - `card list` filters with `--weak`, `--gaps` and `--not-reviewed <days>`, all combined.
  - `review history` takes `--days <n>` (default 7), `--grade <grade>` and `--flag <flag>`.
  - `Flags` widens to `string | boolean | undefined`, since `--weak`, `--gaps` and `--desc`
    take no value. Each command validates its flags with `zod`, and a broken one exits 1 with
    the `invalid options:` line of slice 3 (`InvalidOptionsError`), messages joined by `; `.
- **Rationale**: an output field name needs no mapping, so Claude passes back what it read.
  Numbers go as flags (design §9).
- **Alternatives**: `--order asc|desc` (a value for a yes or no); `--sort -retention` (commander
  reads `-r…` as an option); kebab-case values such as `last-review` (a second spelling of a
  field Claude has just read).

## R3. Windows are counted in local days

- **Decision**: a window of N days runs from the start of the local day N−1 days before today
  up to now, so 1 day is today. Retention and gaps read a window of 30 days, a constant of the
  core (`PROGRESS_WINDOW_DAYS`). `--not-reviewed <n>` and `--days <n>` take whole numbers from 1
  up. `#core/time` gains `startOfDaysAgo(now, days, timeZone)`, and the shell passes its
  result into the core, as it does `today` and `tomorrow`.
- **Rationale**: "today" is already the local day (CLAUDE.md), so "¿cómo me fue hoy?" is
  `--days 1` and "esta semana" is `--days 7`, with no hour of the day leaking into the answer.
- **Alternatives**: a rolling `now − N × 24 h` ("hoy" would include last night); `--since
  <date>` (Claude would compute dates the CLI can compute).

## R4. What counts, in the flag policies

- **Decision**: `FlagPolicy` gains `countsInStats`: `true` in `NO_FLAG`, which an unflagged
  review and `missing-prerequisite` share, and `false` in the voided policy. From the log:
  - a **counted review** has a policy that `countsInStats` and `stateBefore` `review`
    (**Angelo**);
  - **retention** is the counted reviews of the window not graded Again, over all of them,
    pooled over the cards a row covers and rounded to a whole percent; `null` when there are
    none;
  - a **failure** is a counted review graded Again and not flagged `missing-prerequisite`;
    a card with 4 failures, ever, is **weak** (`WEAK_FAILURES`, **Angelo**);
  - a **gap** is a review flagged `missing-prerequisite` in the window.
- **Rationale**: spec 004 R11 keeps what a flag does in one policy, so `not-useful` (slice 7)
  will not compile until it says whether it counts. A gap is the flag itself, read in one
  place. Pooling weighs every review alike, so a card reviewed once does not move a topic as
  much as one reviewed ten times.
- **Alternatives**: `!hidesUntilTomorrow` for "counts" (two effects under one name, which
  R11 rejected); a mean of each card's retention (one review weighs as much as ten); counting
  from the card's FSRS `lapses` (it counts a gap's Again, and the card cannot tell which
  lapses were gaps).

## R5. Due today and new are told apart

- **Decision**: a card is **due today** when its state is `learning`, `relearning` or
  `review`, its `due` is before the start of tomorrow, and no review of today hides it
  (`hidesUntilTomorrow`); a card in state `new` counts as **new**, whatever its `due`.
- **Rationale**: new cards are due from the moment they are saved, so mixing them in would
  turn a big capture into "40 para hoy" while the daily limit lets in 10. Hiding follows the
  lists (005-US2-AS2).
- **Alternatives**: the count `review due` would give (it applies the session cap, so it says
  how much fits in a session, not how much is due); due counting new cards (above).

## R6. Sorting keeps the tree

- **Decision**: `tag stats` orders siblings under their parent by the sort field, depth first,
  so each row follows its parent. `null` sorts last in either direction; ties fall back to the
  default order (`tag` by segments, `lastReview` then `id`). The `deck` total has no place in
  the sort. `card list` sorts its flat list the same way.
- **Rationale**: "¿cuál va peor?" then reads as a tree whose worst branch comes first, and a
  tag without retention never passes for the worst.
- **Alternatives**: a flat list across levels (`messaging` would sit far from its children);
  `null` first when ascending (every untouched topic would come out "worst").

## R7. The whole log is read through the repository there is

- **Decision**: the commands read `StoreCardRepository.active()` and
  `StoreReviewRepository.since(EVER)`, `EVER` being the epoch, a constant of the progress
  unit; a new core unit, `src/core/progress`, does the rest. `#core/tags` exports
  `coveredTags(card)` (the card's tags and their ancestors) and `bySegments`, which
  `tagTree` already uses.
- **Rationale**: weak cards need every failure ever (**Angelo**), and 20,000 reviews map in
  milliseconds (R8). The numbers stay in the pure core, where they are unit tested with a fixed
  clock (constitution II, III); the store stays opaque (ADR-0010).
- **Alternatives**: `GROUP BY` queries in `src/shell/db` (the rules of R4 would live in SQL,
  out of the core's tests); a `ReviewRepository.all()` (a second method for `since` of the
  epoch).

## R8. SC-003 is a test on an arranged store

- **Decision**: `tests/progress/performance.test.ts` saves 1,000 cards through one
  `card add`, inserts 20,000 reviews with `runSql` (`tests/support/store`, which may arrange a
  store file with `node:sqlite`), and runs each command of this slice under 1 second. Each step
  adds its own command to the test.
- **Rationale**: 20,000 reviews cannot be graded through the CLI in a session, and a
  regression to quadratic code should fail the suite, not a measure two weeks later.
- **Alternatives**: a manual `time` on a scratch store (slices 2 and 3; nothing could fill one
  with reviews).

## R9. One local skill, `aletheia-stats`

- **Decision**: `.claude/skills/aletheia-stats/SKILL.md`. Its description carries "¿cómo voy?",
  "¿qué tengo flojo?", "¿qué no repaso hace un mes?", "¿qué fallé esta semana?" and
  "muéstrame mi progreso", none shared with `aletheia-review`. It runs the installed
  `aletheia` for every progress question, finds a Spanish topic's tags from `aletheia tag
  list`, picks `tag stats`, `card list` or `review history` and their options, says once
  what weak and gaps mean, quotes the counts the CLI gives, and says so when no query answers.
  It writes nothing; to study a weak topic, it hands over to `aletheia-review` ("repasemos
  <tema>").
- **Rationale**: design §4 and §8.3: stats is a project-local skill. Picking the query is
  judgment, counting is not (constitution II).
- **Alternatives**: questions answered inside `aletheia-review` (its description would grow
  triggers it does not act on, and stats would only exist mid-review).

## R10. The design and `CLAUDE.md` catch up

- **Decision**: before step 1, design §8.3 says the count of prune candidates arrives with
  prune (slice 7), and §12 drops the retention formula, the window and the leech threshold,
  now decided. At the close, `CLAUDE.md` names the three commands and this contract.
- **Rationale**: the constitution changes the design first (spec 004 R10).

## R11. What is not built

- Mastered cards and the count of prune candidates (slice 7, with prune).
- Configurable window and threshold (design §8.4 asks for them with prune).
- Stored statistics, or any write: no command of this slice changes the store.
- A retention per card: a card has too few reviews in 30 days for a share to mean much.
- History of archived cards: no card is archived before slice 7.
