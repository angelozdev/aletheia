# 0019. Archive, restore and keep as append-only logs

- **Status:** proposed
- **Date:** 2026-11-15
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0013](0013-cards-tags-and-reviews-with-rules-in-the-store.md)

## Context and problem statement

Spec 007 retires a card by archiving it with Angelo's reason, brings it back by restoring it,
and records his choice to keep a prune candidate for one reason, with the other card when two
overlap. Every list already filters on `cards.status`. The spec records each archive, restore
and keep and overwrites none (Assumptions), and a kept reason is read back by instant: a leech
until a later failure, the other reasons for the keep's months. What shape does the store give
them?

## Decision drivers

- Nothing is deleted (constitution III, INV-02); what was decided stays readable after it is
  undone.
- A blank archive reason, an unknown keep reason or an overlap with itself is refused by
  `CHECK` (constitution III).
- The lists keep reading one column.
- Drizzle declares the tables; triggers go in a custom migration, as for `reviews`.

## Considered options

1. `cards.status` kept, and two append-only logs: `status_changes` and `keeps`
2. `archived_at` and `archive_reason` columns on `cards`, and a `keeps` table
3. `cards.status` kept, and one `card_decisions` log for archive, restore and keep

## Decision outcome

Chosen option: **1**, as written in
[the data model](../../specs/007-prune/data-model.md). `status_changes(id, card_id, status,
reason, changed_at)` with `reason` not blank for `archived` and `null` for `active`;
`keeps(id, card_id, reason, overlaps, kept_at)` with `reason` one of four and `overlaps`
present exactly for `overlapping` and never the same card. The card repository writes a status
change and `cards.status` in one transaction. Triggers refuse a delete or an update on both
tables (INV-03).

### Pros and cons of the options

**Two logs beside the status**
- Good, because a restore keeps the archive it undoes, with its reason.
- Good, because each table's rules are plain `CHECK`s.
- Bad, because `cards.status` and the latest status change say the same thing twice; one
  transaction keeps them together, and a test checks they agree.

**Columns on `cards`**
- Good, because `card show` reads one row.
- Bad, because a restore erases the reason, against the spec's "never overwritten".

**One decisions log**
- Good, because one table for everything prune records.
- Bad, because every `CHECK` depends on a kind column (a reason for archive, none for restore,
  an enum for keep), and every read filters by kind.

## Consequences

- Good: an archived and restored card still shows why it was archived; slice 8 can record
  "replaced by #id" as an archive reason with no migration.
- Bad / cost: two more tables whose triggers a later rebuild could drop (the trap of
  ADR-0017); the INV-03 store test catches it.

## Confirmation

CLI tests of 007-US1-AS2, AS3 and 007-US4-AS1 over temp stores; a store test named INV-03 runs
a delete and an update on each table against a migrated temp store and sees both refused.
