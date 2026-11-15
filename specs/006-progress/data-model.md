# Data Model: Progress

No table, column or migration changes: every number is derived from `cards`, `card_tags` and
`reviews` on each call (constitution VI). Decisions in [research.md](./research.md).

## Rules in the core

`src/core/reviews`, one policy per flag (spec 004 R11), gains one field:

| Policy | `countsInStats` | Flags |
|---|---|---|
| `NO_FLAG` | `true` | none, `missing-prerequisite` |
| voided | `false` | `badly-written`, `badly-rephrased` |

`src/core/progress`, new. Its constants: `PROGRESS_WINDOW_DAYS = 30`, `WEAK_FAILURES = 4`,
`EVER` (the epoch). Its inputs: the active cards, every review, `now`, `today`, `tomorrow` and
`windowStart` (R3), all computed by the shell through `#core/time`.

### Per review

| Fact | Rule |
|---|---|
| counted | `policyOf(flag).countsInStats` and `stateBefore = review` |
| passed | counted, and `grade ≠ again` |
| failure | counted, `grade = again`, and `flag ≠ missing-prerequisite` |
| gap | `flag = missing-prerequisite` and `reviewedAt ≥ windowStart` |
| in window | `reviewedAt ≥ windowStart` |

### Per card

| Field | Rule |
|---|---|
| `failures` | its failures, ever |
| `weak` | `failures ≥ WEAK_FAILURES` (amended by spec 007: `failures ≥ leechFailures`) |
| `gaps` | its gaps |
| `lastReview` | its latest `reviewedAt`, voided reviews included; `null` if never reviewed |
| due today | state `learning`, `relearning` or `review`, `due < tomorrow`, and no review since `today` whose policy `hidesUntilTomorrow` |
| new | state `new` |

### Progress row (`tag stats`)

One per tag in use by a card in scope and each of its ancestors (`coveredTags`), plus `deck`,
over every card in scope. Each card counts once in a row, however many of its tags the row
covers.

| Field | Rule |
|---|---|
| `tag` | the tag; absent in `deck` |
| `cards` | cards covered |
| `new` | of them, new |
| `due` | of them, due today |
| `retention` | passed ÷ counted, over the covered cards' counted reviews in the window, as a whole percent (`Math.round`); `null` with no counted review |
| `weak` | of them, weak |
| `gaps` | the covered cards' gaps |

Order: by `tag` segments; with `--sort`, siblings under their parent by the field, `null`
last, ties by segments (R6).

### Card row (`card list`)

`id`, `question` (stored), `tags`, `state`, `due`, `lastReview`, `failures`, `gaps`, `weak`.
Filters, all combined: under the tags; `--weak`: `weak`; `--gaps`: `gaps > 0`;
`--not-reviewed <n>`: `lastReview < windowStart(n)`, or never reviewed and
`createdAt < windowStart(n)`. Order: `lastReview`, then `id`; `null` last.

### History entry (`review history`)

`card`, `reviewedAt`, `grade`, `claudeGrade`, `flag`, `askedQuestion` (`null` before slice 5),
for every review with `reviewedAt ≥ windowStart(days)` whose card is in scope, matching
`--grade` and `--flag` when given; newest first. Counts over those same reviews:

| Count | Rule |
|---|---|
| `reviews` | all of them |
| `grades` | one per grade: `again`, `hard`, `good`, `easy` |
| `flags` | one per flag of `REVIEW_FLAGS` |
| `disputed` | `grade ≠ claudeGrade` |

## Invariants

- INV-01 stands: every test runs on a temp store.
- No command of this slice writes: the row counts of `cards`, `card_tags` and `reviews` are the
  same after each call (covered in each command's tests).
