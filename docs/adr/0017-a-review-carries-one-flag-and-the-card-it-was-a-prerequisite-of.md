# 0017. A review carries one flag and the card it was a prerequisite of

- **Status:** accepted
- **Date:** 2026-11-10
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0013](0013-cards-tags-and-reviews-with-rules-in-the-store.md)

## Context and problem statement

Spec 004 marks a review as a missing prerequisite (a real failure that counts as a gap) or as
badly written (a voided review that schedules nothing). It also records that a card was asked
as the prerequisite of another, so that card's first grade in a session counts toward neither
the session cap nor the day's new cards. A review never carries both flags, and a missing
prerequisite always goes with the grade Again (spec FR-001). Stats and prune read the flags
later (slices 6 and 7). What shape does the review log give them?

## Decision drivers

- A contradiction is refused at write time by `CHECK` where SQL can say it (constitution III):
  both flags, a gap that is not Again, a card that is its own prerequisite.
- Every review before this slice reads as unflagged, with nothing to backfill.
- Drizzle declares it, so the migration is generated, not hand-written.
- The review log stays append-only: its two triggers survive the migration.

## Considered options

1. Two nullable columns on `reviews`: `flag` and `prerequisite_of`
2. A `flags` JSON array column and `prerequisite_of`
3. A `review_flags` table, one row per flag

## Decision outcome

Chosen option: **1**. `flag text` with `CHECK (flag IS NULL OR flag IN ('missing-prerequisite',
'badly-written'))` and `CHECK (flag IS NOT 'missing-prerequisite' OR grade = 'again')`;
`prerequisite_of text REFERENCES cards(id)` with `CHECK (prerequisite_of IS NULL OR
prerequisite_of <> card_id)`. `null` means no flag, or not asked as a prerequisite. A voided
review is one whose `flag` is `badly-written`; nothing else stores it.

Adding table `CHECK`s makes `drizzle-kit generate` rebuild `reviews` (create `__new_reviews`,
copy, drop, rename), which drops its triggers `reviews_never_deleted` and
`reviews_never_changed`. A custom migration right after it creates them again, word for word.

### Pros and cons of the options

**Two nullable columns**
- Good, because "never both" is the column's shape, and each rule is one plain `CHECK`.
- Good, because the reviews before this slice need nothing: `null` is right for them.
- Bad, because the generated migration rebuilds the table, and its triggers must be restored
  by hand in the next migration.

**A JSON array**
- Good, because a third flag needs no migration.
- Bad, because "never both" and "a gap is Again" go through `json_each` in hand-written SQL,
  and Drizzle sees only text.

**A flags table**
- Good, because the review table is left as it is, with no rebuild.
- Bad, because "never both" needs a unique index and "a gap is Again" a trigger reading the
  review; every list joins one more table.

## Consequences

- Good: a contradictory review is refused by the store as well as by the CLI; slices 6 and 7
  read one column.
- Bad / cost: a third flag means a migration and another table rebuild; the rebuild's lost
  triggers are a trap for any later migration that adds a `CHECK` to `reviews` or `cards`.

## Confirmation

CLI tests of 004-US1-AS1, AS2 and 004-US2-AS1 over temp stores; the store refusing each
contradiction, and still refusing to delete or change a review after the migration, seen
failing through `tests/support/store`.
