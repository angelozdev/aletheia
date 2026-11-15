# Feature Specification: Progress

**Feature Branch**: `006-progress` | **Created**: 2026-11-15 | **Status**: Draft
**Input**: Slice 6 of `docs/design/2026-11-08-aletheia-design.md` §13: progress. A tag tree with each topic's cards, retention, cards due today, weak cards (leeches) and gaps, filterable by tag and sortable by any column, and filterable queries Claude runs to answer free-form questions ("¿qué tengo flojo?", "¿qué no repaso hace un mes?") (design §8.3), through a new local skill. Angelo exercises it by asking "¿qué tengo flojo?".

## Clarifications

### Session 2026-11-15

- Q: Which reviews count toward a topic's retention? → A: Only reviews of a card already learned (in review before it), not voided: recall days after learning, comparable with FSRS's 0.9. A new card's first sight and a same-session re-show do not count, so a card just captured gives no retention until it comes back. Counting every non-voided review (a re-show minutes after the answer inflates it) and FSRS's predicted recall (a prediction, not the log) were rejected.
- Q: How many failures make a card weak, and over what period? → A: 4 counted failures (Again on a learned card, not voided, not flagged missing-prerequisite), ever: a badly written card fails fast, since FSRS brings it back sooner after each lapse, and lapses that accumulate match prune's keep, which waits for new lapses (design §8.4). 3 (flags normal forgetting over time), 8 (Anki's default, late for a small deck) and 4 in the last 90 days (forgets old lapses) were rejected.
- Q: Does the review history (US3) belong in this slice? → A: Yes, whole: one line per review and the counts. It is the only way to read the Measures of slices 4 and 5 (004 SC-003, 005 SC-002) from the log instead of from memory. It reads the reviews already stored, so it needs no new table. Counts without the lines (no way to see which card was voided twice) and a slice of its own (those Measures wait for it) were rejected.

## User Scenarios & Testing _(mandatory)_

Every number is a fact the CLI computes from the review log (constitution II, VI); picking the query that answers Angelo's question and saying what the numbers mean is judgment. Nothing in this slice writes to the deck.

### User Story 1 - How each topic is going (Priority: P1)

Angelo asks "¿cómo voy?". Claude shows the tree: `messaging` 12 cards, 2 new, 3 due today, retention 78%, 1 weak, 2 gaps; under it `messaging::redis-streams` 8 cards, retention 71%, the weak card and both gaps. He asks "¿y de aws?" and sees only `aws` and its subtopics; "¿cuál va peor?" and the same rows come sorted by retention, worst first.
**Independent Test**: on a deck with reviews under two tag families, the tree gives each tag's numbers, a filter on one family gives only its rows, and a sort reorders siblings.

1. **006-US1-AS1** Given active cards and their reviews, When the progress tree is asked, Then every tag in use by an active card and its ancestors gives its cards, new cards, cards due today (cards already seen, due before the local day ends; new cards are counted apart), retention, weak cards and gaps, counting each card it covers once (a card under two subtopics counts once in their parent), and a total line covers the whole deck.
2. **006-US1-AS2** Given reviews of the last 30 days, When retention is computed, Then it is the share passed (Hard, Good or Easy) of the counted reviews: those of a card already learned (in review, not new, learning or relearning), not voided. A missing-prerequisite Again counts as a failure. A tag with no counted review has no retention, not 0%.
3. **006-US1-AS3** Given a card with 4 counted failures (Again on a learned card, not voided, not flagged missing-prerequisite; amended by spec 007: the leech-failures setting, 3 by default), When the tree is asked, Then it counts as weak under each of its tags; a gap is a review flagged missing-prerequisite in the last 30 days, counted under the reviewed card's tags.
4. **006-US1-AS4** Given a tag, When the tree is filtered by it, Then only that tag and its descendants are given; a tag with no active card under it exits 1 naming it.
5. **006-US1-AS5** Given a column and a direction, When the tree is sorted, Then siblings are ordered by that column under their parent, so the tree stays a tree; an unknown column exits 1 naming the valid ones.
6. **006-US1-AS6** Given the stats skill file, When it is read, Then its description carries the Spanish phrases that trigger it, it answers every progress question by running the installed `aletheia` in that turn, finds the tag of a topic named in Spanish from the tags in use, says what weak and gaps mean the first time it shows them, and writes nothing.

### User Story 2 - Which cards (Priority: P2)

"¿qué tengo flojo de mensajería?": Claude lists the weak cards under `messaging`, each with its question, failures, gaps and last review. "¿qué no repaso hace un mes?": the cards whose last review is more than 30 days old, oldest first.
**Independent Test**: on a deck with a weak card, a card with a gap and a card last reviewed 40 days ago, each filter gives exactly the cards it names.

1. **006-US2-AS1** Given active cards, When cards are asked with any of the filters (under a tag, weak only, with gaps, not reviewed in the last N days), Then exactly the cards matching all of them are given, each with its id, stored question, tags, state, due, last review, counted failures and gaps.
2. **006-US2-AS2** Given a card never reviewed, When cards not reviewed in the last N days are asked, Then it is given, marked never reviewed, if it was saved more than N days ago.
3. **006-US2-AS3** Given a column and a direction, When the cards are sorted, Then they are ordered by it; an unknown column exits 1 naming the valid ones.
4. **006-US2-AS4** Given the stats skill file, When it is read, Then it turns a free-form question into the tree or the card filters that answer it, and when none does, says so instead of estimating.

### User Story 3 - How the reviews went (Priority: P3)

At the end of two weeks Angelo asks "¿cuántos repasos anulaste por reformulación?" and "¿qué fallé esta semana?". Claude reads the reviews of the period: 3 voided as `badly-rephrased` out of 64, and the four Agains with the question as it asked them.
**Independent Test**: on a log with reviews inside and outside a period, the history gives only the period's, its counts match them, and each filter narrows both.

1. **006-US3-AS1** Given reviews, When the history of the last N days is asked, optionally under a tag, with a grade or with a flag, Then it gives each matching review, newest first, with its card, instant, grade, Claude's grade, flag and question as asked (none before slice 5), and counts of the matching reviews by grade, by flag, and those whose grade differs from Claude's.
2. **006-US3-AS2** Given the stats skill file, When it is read, Then it answers questions about past reviews from the history, quoting its counts rather than counting rows itself.

### Edge Cases

- An empty deck, or a deck with no reviews: the tree has only the total line, with no retention; the lists are empty.
- A voided review (`badly-written`, `badly-rephrased`) never counts toward retention, weak or gaps, but appears in the history with its flag and counts as the card's last review.
- A card graded Again and shown again in the same session: the re-show is a relearning review and does not count toward retention.
- A card under `messaging::redis-streams` and `messaging::rabbitmq` counts once in `messaging` and once in each child.
- A card voided today is not due today, as in the lists.
- Angelo names a topic in Spanish ("mensajería"): Claude finds its tag in the tags in use, as in topic review.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST give the progress tree of US1: per tag in use and its ancestors, and for the whole deck, the active cards, new cards, cards due today, retention, weak cards and gaps, filterable by tag and sortable by any column in either direction.
- **FR-002**: Retention MUST be the share passed of the counted reviews of the last 30 days (006-US1-AS2); a card MUST be weak at 4 counted failures, ever (amended by spec 007: the leech-failures setting, 3 by default); a gap MUST be a review flagged missing-prerequisite in the last 30 days.
- **FR-003**: The CLI MUST list cards by the filters of US2, combined, sortable by any column in either direction.
- **FR-004**: The CLI MUST give the review history of US3 for a period, with its filters and counts.
- **FR-005**: Every number of FR-001 to FR-004 MUST be computed by the CLI and covered by its tests; the skill only picks the query and relays it (constitution II). No command of this slice MAY change the store.
- **FR-006**: A local stats skill MUST answer progress questions through the installed `aletheia`, in Spanish, never from memory or from earlier in the session (constitution VIII).

### Key Entities

- **Counted review**: a review of a learned card that was not voided; retention and weak read only these.
- **Weak card**: a card with 4 or more counted failures; the leech of design §8.4.
- **Gap**: a review flagged missing-prerequisite; a topic with gaps lacks a base, which is not the same as a weak topic.
- **Progress row**: a tag, or the whole deck, with its six numbers.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo asks "¿qué tengo flojo?" in `prod` and Claude answers with topics and cards, without a command or a `/`.
- **SC-002**: In the first two weeks, Angelo finds no progress number Claude stated that the CLI did not give.
- **SC-003**: Each query of this slice answers in under 1 second on a deck of 1,000 cards and 20,000 reviews.
- **SC-004**: When their two weeks end, Angelo reads the Measures of slices 4 and 5 from the review history (004 SC-003, 005 SC-002), without opening a store.

## Assumptions

- Statistics are derived from the review log on every query; nothing is stored, and no migration is needed (constitution VI).
- The 30-day window and the threshold of 4 are constants of the core; making them configurable waits for prune (design §8.4).
- Mastered cards and the count of prune candidates arrive with prune in slice 7, as do archived cards, which will leave every view, and the `not-useful` flag.
- A question no query answers gets a new view only when Angelo asks for it more than once (design §8.3).
- Command names, flags, output fields and the exact form of each column are left to the plan.
