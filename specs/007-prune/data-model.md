# Data Model: Prune

Decisions in [research.md](./research.md); the store shape in
[ADR-0019](../../docs/adr/0019-archive-restore-and-keep-as-append-only-logs.md).

## Store

### `card_status_history`, new

| Column | Type | Rule |
|---|---|---|
| `id` | integer | primary key |
| `card_id` | text | not null, references `cards(id)` |
| `status` | text | `active` or `archived` (`CARD_STATUSES`) |
| `reason` | text | not blank when `archived`; `null` when `active` |
| `changed_at` | text | not null, UTC instant |

One row per archive or restore, written with `cards.status` in one transaction. A card's
archive reason and instant are those of its latest row.

### `keeps`, new

| Column | Type | Rule |
|---|---|---|
| `id` | integer | primary key |
| `card_id` | text | not null, references `cards(id)` |
| `reason` | text | `leech`, `not-useful`, `outdated-situation` or `overlapping` (`KEEP_REASONS`) |
| `overlaps` | text | references `cards(id)`; not null exactly when `reason = overlapping`; `<> card_id` |
| `kept_at` | text | not null, UTC instant |

### Changed

- `reviews.flag`: `CHECK` gains `not-useful`. The generated migration rebuilds the table; the
  custom one after it restores `reviews_never_deleted` and `reviews_never_changed`.
- `settings`: `leech_failures` and `keep_months`, integer, nullable, each `>= 1`.
- Triggers, custom migration: `card_status_history_never_deleted`, `card_status_history_never_changed`,
  `keeps_never_deleted`, `keeps_never_changed` (INV-03).

Migrations, in order: `card_status_history` and its triggers (step 1), `not_useful` and the
reviews triggers (step 4), `keeps` and its triggers (step 5), `prune_settings` (step 7).

## Rules in the core

### Flags (`src/core/reviews`)

| Policy | Flags |
|---|---|
| `NO_FLAG` | none, `missing-prerequisite`, `not-useful` |
| voided | `badly-written`, `badly-rephrased` |

`isCounted` and `isFailure` (006 data model, "Per review") move here from `src/core/progress`.

### Settings (`src/core/settings`)

| Setting | Built-in | Read by |
|---|---|---|
| `leechFailures` | 3 | leech candidates; `weak` in `tag stats` and `card list` |
| `keepMonths` | 6 | the keep window; `kept` |

### Candidates (`src/core/prune`, new)

Inputs: the active cards, `topic`, every review, every keep, `leechFailures`, and
`keepStart = monthsBefore(now, keepMonths)`.

| Reason | A candidate when | Left out when |
|---|---|---|
| `leech` | its failures, ever, `>= leechFailures` | its latest `leech` keep is later than its last failure |
| `not-useful` | it has a review flagged `not-useful` | it has a `not-useful` keep with `keptAt >= keepStart` |

Candidate row: `id`, `question` (stored), `tags`, `reasons` (`leech` before `not-useful`),
`failures`, `lastFailure` (`null` without failures), `notUseful` (`{ at, rationale }` of its
latest `not-useful` review, or `null`). Order: as saved (`bySaved`).

`kept`: the keeps of the cards in scope, or whose `overlaps` is in scope, with
`keptAt >= keepStart`, newest first, each
`card`, `reason`, `overlaps` (`null` unless overlapping), `keptAt`.

`deck.candidates` in `tag stats`: the candidate rows of its scope.

### Archive, restore, keep (`src/core/cards`, `src/core/prune`)

| Action | Needs | Records | Refused with |
|---|---|---|---|
| archive | an active card, a reason not blank | `status: archived`, the reason, `now` | `card "<id>" not found`, `card "<id>" is archived`, a blank reason |
| restore | an archived card | `status: active`, `now`; the schedule untouched | `card "<id>" not found`, `card "<id>" is not archived` |
| keep | an active card; for `overlapping`, another active card; for `leech` and `not-useful`, a candidate for it now | the keep, `now` | not found, archived, an unknown reason, `--overlaps` missing, extra or the same card, `card "<id>" is not a <reason> candidate` |
| grade, edit | an active card, and an active `prerequisiteOf` | as before | `card "<id>" is archived` |

## Invariants

- INV-01 stands: every test runs on a temp store.
- INV-02 stands: archiving deletes nothing; `cards_never_deleted` still refuses a delete.
- **INV-03** (new, spec 007): a status change or a keep is never deleted or changed; the store
  refuses both.
