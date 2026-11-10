# Research: Topic Review

Decisions marked **Angelo** were his, in the spec's Clarifications; the rest wait for his review
with ADR-0016. Nothing here needs a new dependency.

## R1. Four commands, and options on the two lists

- **Decision**: `aletheia tag list`; `aletheia review topic <tag>...`; the options `--session`,
  `--session-size`, `--new-per-day` and `--new-share` on `review due` and `review topic`;
  `aletheia settings show` and `aletheia settings set` (**Angelo**: flags under a `settings`
  group, `default` to go back). Tags go as arguments: their alphabet (`a`–`z`, digits, `-`,
  `:`) means nothing to a shell, so nothing needs quoting (contracts/cli.md).
- **Rationale**: a topic is a different selection from the due list (cards not due enter, cards
  graded today leave), so it gets its own command; both share the session options and the
  output. Tags are a deck-wide concept, so they get their own group.
- **Alternatives**: `review due --tag` (one command with two selection rules, and "due" holding
  cards that are not due); `card tags` (tags are not one card's); JSON on stdin for numbers
  (rejected by Angelo).

## R2. A topic compares whole segments, in a new core unit

- **Decision**: `src/core/tags` owns the tag tree and topic membership. A card is under a topic
  when one of its tags equals a topic tag or starts with it followed by `::`. The tree expands
  every tag of every active card into itself and its ancestors, counts each card once per tag,
  and sorts by segments (`messaging` < `messaging::rabbitmq` < `messaging-legacy`), so a tag's
  descendants follow it. `TAG_SEPARATOR` moves here from `src/core/similar`, which imports it.
- **Rationale**: the hierarchy is a fact with tests (constitution II). Comparing strings would
  sort `messaging-legacy` between `messaging` and its children (`-` sorts before `:`), and
  `startsWith('messaging')` alone would put it under `messaging` (003-US1-AS2). The active
  cards are already loaded whole for the due list; 1,000 cards in memory is far under 1 s.
- **Alternatives**: `LIKE 'messaging::%'` in the adapter (the rule would live in SQL, outside
  the core's tests); a stored tag table (derived data, against design §5).

## R3. A topic's cards: the due list over the topic, then the rest

- **Decision**: the topic list is `dueList` run over the topic's cards, followed by its review
  cards that are not due, soonest first, leaving out those whose `lastReview` falls in the
  local today. `dueList` and its tests stay as they are. `src/core/time` gains
  `startOfToday`.
- **Rationale**: it gives the order of FR-002 and the (re)learning rules of 001 FR-004,
  learn-ahead included, without a second copy of them. The card's `lastReview` already says
  whether it was graded today; the review log is not needed for that.
- **Alternatives**: a separate ordering for topics (two rules for the same cards, which would
  drift apart).

## R4. The session is an instant Claude repeats, counted from the review log

- **Decision** (**Angelo**): the list prints `session`, the instant the session began: now, on a
  call without `--session`. Claude repeats it with `--session <instant>` on every later list
  call of that round. The core counts the distinct cards graded since that instant, from
  `ReviewRepository.since(instant)`, a new read on the existing port. A card graded in the
  session that is due again (a re-show) takes no place. An instant that does not parse, or
  that is later than now, exits 1. An earlier one is honored, so a session that crosses
  midnight keeps its count. Going on at the cap means a call without `--session` and without
  one-session limits (**Angelo**).
- **Rationale**: nothing new in the schema, and the count comes from the log, which is the
  truth. A lost instant costs at most one more round of 20 (spec).
- **Alternatives**: a stored session row (design §14, until a lost instant causes real
  trouble); counting in the skill (a business rule in a prompt, constitution II).

## R5. The daily limit takes held-back new cards out before the due list

- **Decision**: cards introduced today are the reviews since the local day began whose
  `stateBefore` is `new`. In a general review, the budget is the daily limit minus that count.
  The first saved new cards fill the budget; the rest are held back and removed before
  `dueList` runs, so its learn-ahead rule still sees "nothing else due". A topic review holds
  back nothing (spec Clarifications). With held-back cards, `nextDue` is the start of the
  local tomorrow, or an earlier due instant if one comes first.
- **Rationale**: the learn-ahead rule must see the list after the cap. Otherwise held-back new
  cards would hide a card graded Again 5 minutes ago, and the review would stop while that
  card is still pending.
- **Alternatives**: applying the cap after `dueList` (the bug above); counting introduced cards
  from the card's `reps` (a card first graded yesterday also has `reps > 0`).

## R6. Placing the session's cards

- **Decision**: `src/core/sessions` fills the session's places, from the one after the cards
  already graded in the session up to the session size. There are `k = ceil(size × share /
  100)` share places, the i-th at `ceil(i × size / k)` (20 at 10 %: 10 and 20; 5 at 10 %: 5).
  Each place takes a new card if it is a share place and the budget allows one; otherwise the
  next due card (learning, then review); otherwise a new card within the budget; otherwise, in
  a topic, the next card not due. Re-shows lead the list and take no place. `remaining` counts
  the eligible cards that did not fit; `heldBack` counts the new cards beyond the budget;
  `capReached` is true when the session has graded as many distinct cards as its size.
- **Rationale**: it matches every scenario in the spec (003-US3-AS5: 18 reviews, new cards 10th
  and 20th, 90 remaining and 40 held back). New cards beyond the share go after the due cards,
  as FR-002 orders them.
- **Alternatives**: spreading every new card evenly among the reviews (Anki's mix: it changes
  the order of a topic whose due cards fit); reserving the share at the start (new cards
  first, then a backlog).

## R7. Settings: one row with a nullable column each

- **Decision** (ADR-0016, proposed): a table `settings` with `id` fixed at 1 and the nullable
  integers `session_size`, `new_per_day` and `new_share`, with `CHECK`s for the ranges of
  FR-009. `null` means the built-in default; `settings set --x default` writes `null`. One
  generated migration, with no custom SQL. The core owns the built-in values, how they layer
  (one-session > setting > built-in) and a `SettingsRepository` port.
- **Rationale**: each setting gets its own type and its own `CHECK`, which Drizzle declares.
  `null` makes "still at the default" a fact in the store instead of a comparison with the
  value. A new setting later is one more column.
- **Alternatives**: key/value rows (a loose type and a `CHECK` per name inside a `CASE`); a JSON
  column (range checks through `json_extract`); `PROFILE.md` or a config file (rejected by
  Angelo).

## R8. Options at the CLI edge

- **Decision**: `CliCommand` gains `options` (flag, value name, description) and a variadic
  argument (`<tags...>`); `main` passes the command's options to `run`. A shared unit in
  `src/shell/cli/invocation/` validates the four options with zod: whole numbers written in
  digits only, ranges from FR-009, `--session` parsed by `#core/time`. `default` is accepted
  by `settings set` only. Every invalid option is named in one `error:` line, as for cards.
- **Rationale**: commander already parses the flags; zod at the edge is the constitution's
  rule. The same checks serve the two lists and `settings set`.

## R9. `review due` prints four more fields

- **Decision**: `review due` and `review topic` print `session`, `count`, `remaining`,
  `heldBack`, `capReached`, `nextDue` and `cards`, in that order. The skill reads them in
  step 4 (session) and step 5 (held back).
- **Consequence**: three 001 CLI tests compare `review due`'s exact stdout (001-US2-AS1 "as the
  contract shows it", both 001-US2-AS5) and will need the new lines. The scenarios they cover
  do not change. Following the repo's rule, they are raised with Angelo in step 4 before they
  are touched.

## R10. The design catches up

- **Decision**: before step 1, design §5 gains **Settings** (the store's lasting defaults, one
  set per store, `null` until changed) and §9 *Input* says that numbers go as flags and text as
  JSON on stdin. These are two lines, in their own commit.
- **Rationale**: the constitution changes the design first; the spec moved during
  clarification.
