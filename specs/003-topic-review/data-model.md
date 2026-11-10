# Data Model: Topic Review

Slice 3 adds one table, `settings`, and reads the review log it already has. The tag tree, the
topic, the session and the caps are derived on every call and never stored. Decisions and their
reasons are in [research.md](./research.md).

## Settings: table `settings`

One row at most, written by `settings set` (ADR-0016).

| Column | Type | Rule |
|---|---|---|
| id | integer, primary key | `CHECK (id = 1)`: one set per store |
| session_size | integer, nullable | `null` or 1 or more |
| new_per_day | integer, nullable | `null` or 0 or more |
| new_share | integer, nullable | `null` or 0 to 100, a whole percent |

`null` means the built-in default: session size 20, new cards per day 10, new share 10 %.
With no row, every setting is `null`. `settings set` upserts the row and changes only the
columns it names. `default` writes `null`. One generated migration (`pnpm db:generate --name
settings`); `prod` is backed up before it applies (ADR-0002).

Each limit comes from the first of these that gives it: the flag for this session
(`--session-size 10`), the stored setting, the built-in default.

## Review log: read, not changed

`ReviewRepository.since(instant)` returns the reviews whose `reviewed_at` is at or after the
instant. A list call reads them once, from the earlier of the session start and the start of
the local today:

- **graded in the session**: the distinct cards with a review at or after the session start;
- **introduced today**: the reviews at or after the start of the local today whose
  `state_before` is `new` (a card is new only once).

## Tag tree

For each active card, the set of its tags and every ancestor (`messaging::redis-streams` →
`messaging`, `messaging::redis-streams`). Each tag in the union, with the number of cards whose
set holds it, sorted by segments: `docker`, `docker::commands`, `messaging`,
`messaging::rabbitmq`, `messaging-legacy` (003-US1-AS1).

## Topic

One or more well-formed tags. A card is under the topic when one of its tags equals a topic tag
or starts with that tag followed by `::`, so `messaging` covers `messaging::rabbitmq` and never
covers `messaging-legacy` (003-US1-AS2). Each card appears once, however many of its tags fall
under it. A topic tag that covers no active card is refused.

## Session list

A pure rule in `src/core/sessions`, the same for `review due` (the scope is every active card)
and `review topic` (the scope is the topic's cards). Its inputs are the scope, now, the start of
the local today and of tomorrow, the session start, the reviews since (above) and the three
limits.

1. **Budget for new cards**: in a general review, the daily limit minus the cards introduced
   today, never below 0. In a topic review there is no budget limit. The first new cards saved
   fill the budget; the rest are **held back** and leave the scope.
2. **Eligible**: `dueList` (001 data model) over what is left of the scope. In a topic, the
   eligible cards also include, after those, the `review` cards due from tomorrow on, soonest
   first, except those whose `last_review` falls in the local today (003-US1-AS3, AS5).
3. **Re-shows**: eligible cards graded in the session (a card graded Again and due again). They
   lead the list and take no place (003-US2-AS2).
4. **Places**: from `graded in the session + 1` to the session size, the session's places are
   filled in order. There are `k = ceil(size × share / 100)` share places, the i-th at
   `ceil(i × size / k)`. A share place takes the next new card if any is left. Any other place,
   or a share place with no new card left, takes the next due card (learning, then review). When
   none is left, it takes a new card, and in a topic, after that, a card that is not due. When
   nothing is left, filling stops.
5. **Output**:
   - `cards`: the re-shows, then the filled places, in order.
   - `remaining`: the eligible cards that did not fit.
   - `heldBack`: the new cards beyond the budget, always 0 in a topic.
   - `capReached`: true when the cards graded in the session number the session size or more.
   - `nextDue`: the earliest `due` among the scope's cards that are neither listed, nor
     remaining, nor held back, or the start of the local tomorrow when `heldBack > 0`,
     whichever comes first; `null` when there is neither.

Worked example (003-US3-AS5): 100 review cards due, 50 new, none introduced today, a session of
20 at 10 %. The budget is 10 and the share places are 10 and 20. The list holds reviews in
places 1 to 9, a new card at 10, reviews at 11 to 19 and a new card at 20. `remaining` is 90
(82 reviews, 8 new) and `heldBack` is 40.

## What the store refuses

By `CHECK`, whatever the CLI does: a second settings row; a session size below 1; new cards per
day below 0; a share below 0 or above 100. The CLI edge (zod) adds what SQL cannot say: whole
numbers written in digits only, and the message that names each invalid setting (003-US4-AS3).
A refused `settings set` changes nothing.
