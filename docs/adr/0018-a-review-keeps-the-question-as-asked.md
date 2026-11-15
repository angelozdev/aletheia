# 0018. A review keeps the question as asked

- **Status:** proposed
- **Date:** 2026-11-14
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0017](0017-a-review-carries-one-flag-and-the-card-it-was-a-prerequisite-of.md)

## Context and problem statement

From spec 005, Claude rephrases every question it asks, and the review log keeps the question
as asked (design §8.2 step 16). Every review recorded from then on carries it, and the reviews
before keep none. A review voided because Claude's rephrasing decided the answer carries a
third flag, `badly-rephrased`, so stats and prune can tell it from a badly written card. Where
does the asked question live, and how does the flag join the two already there?

## Decision drivers

- A blank question is refused at write time by a `CHECK` (constitution III).
- No backfill: the reviews before the slice were asked as stored, or rephrased with no record.
- Drizzle declares it, so the migration is generated, not hand-written.
- The review log stays append-only: its two triggers survive every rebuild.

## Considered options

1. A nullable column `asked_question` on `reviews`, never blank
2. A `NOT NULL` column, with the old rows filled from the card's current question
3. A `review_questions` table, one row per review

## Decision outcome

Chosen option: **1**. `asked_question text` with `CHECK (asked_question IS NULL OR
length(trim(asked_question)) > 0)`. `null` means a review from before spec 005. The CLI refuses
a new review without it, since SQL cannot tell an old review from a new one. `review grade`
names the field `askedQuestion`.

`reviews_flag` gains `badly-rephrased`, with no other rule: it takes any grade, like
`badly-written`, and has `badly-written`'s policy in the core.

Each change rebuilds `reviews` through `drizzle-kit generate`, which drops
`reviews_never_deleted` and `reviews_never_changed`. A custom migration after each one creates
them again, word for word, as ADR-0017 did.

### Pros and cons of the options

**A nullable column**
- Good, because the reviews before the slice need nothing: `null` is right for them.
- Good, because "not blank" is one plain `CHECK`.
- Bad, because "required on new reviews" lives only in the CLI.

**A `NOT NULL` column with a backfill**
- Good, because SQL refuses a review without a question.
- Bad, because the backfill is false: a card rewritten in slice 4 no longer has the question it
  was asked with.

**A separate table**
- Good, because `reviews` is not rebuilt for the column.
- Bad, because one text needs a join, and "required" is still out of SQL's reach.

## Consequences

- Good: stats (slice 6) can read the question each grade answered, and the flag tells a bad
  rephrasing from a bad card.
- Bad / cost: two more table rebuilds, each with its triggers restored by hand. The rebuild runs
  on `prod`'s real reviews for the first time, so a store test now migrates a store that holds
  reviews.

## Confirmation

CLI tests of 005-US1-AS1, AS2 and 005-US2-AS1 over temp stores. Through `tests/support/store`:
the store refusing a blank question; a store migrated from the last released migration keeping
every review unchanged; and the store still refusing to delete or change a review afterwards.
