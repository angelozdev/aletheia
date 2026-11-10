# Data Model: Gaps and Rewrites

Adds to [slice 1's model](../001-capture-and-review/data-model.md) and
[slice 3's](../003-topic-review/data-model.md). Decisions in [research.md](./research.md).

## Review (table `reviews`, two new columns)

| Column | Type | Rule |
|---|---|---|
| `flag` | text, null | `null`, `missing-prerequisite` or `badly-written`; `missing-prerequisite` only with `grade = 'again'` |
| `prerequisite_of` | text, null | `null`, or the id of another card (`references cards(id)`, `<> card_id`) |

- Every review from before the slice reads `flag = null`, `prerequisite_of = null`.
- A **voided review** is one with `flag = 'badly-written'`. It is kept like any review and
  changes nothing in its card's schedule.
- A **gap** is a review with `flag = 'missing-prerequisite'`: a real Again, scheduled as such.
- A **prerequisite review** is one with `prerequisite_of` set: the card was asked because the
  named card failed for its lack. It may also carry a flag.

Migrations, in order (R2):

1. Generated: adds both columns and their `CHECK`s, rebuilding `reviews`.
2. Custom: `reviews_never_deleted` and `reviews_never_changed` again, as in
   `20261110005603_reviews_never_change`.

## Card (table `cards`, no new column)

An edit replaces any of `type`, `question`, `answer`, `key_points`, `situation` and the card's
rows in `card_tags`, and sets `updated_at`. It never writes `id`, `source`, `status`,
`created_at` or the schedule columns. The old text is not kept (spec Clarifications).

Migration (R7):

3. Custom: `card_search_on_update`, `AFTER UPDATE OF question, answer, key_points, situation ON
   cards`, rewriting the card's row in `card_search`.

## Rules in the core

`src/core/reviews`, one policy per flag (R11):

| Flag | `schedule` | `hidesUntilTomorrow` | `countsAsIntroduced` |
|---|---|---|---|
| none (`NO_FLAG`) | `scheduleAfter` (001 FR-005) | false | true |
| `missing-prerequisite` | `NO_FLAG`'s | false | true |
| `badly-written` | keeps the card as it was (R3) | true | false |

- `gradeCard` schedules through `policyOf(draft.flag).schedule` and records the review.
- `prerequisiteOf` names a card that must exist (`cardById`).

`src/core/sessions` (`sessionList`), over the reviews since the earlier of the session's start
and the local today (R4, R5):

| Count | Reviews it takes |
|---|---|
| Hidden until tomorrow | since the local today, whose flag's policy `hidesUntilTomorrow`: their cards leave the scope, and `nextDue` is at most tomorrow |
| Shown in the session | every review since the session began: their cards are re-shows when due again |
| Counted toward the cap | the cards shown in the session, minus those whose first review since the start names a `prerequisiteOf` |
| Introduced today | since the local today, `stateBefore` = `new`, whose flag's policy `countsAsIntroduced`, no `prerequisiteOf` |

`src/core/cards` (`editCard`): finds the card, applies the given fields, sets `updatedAt` to now,
saves through `CardRepository.update(card)` (R7).

## Types

- `ReviewFlag`: `'missing-prerequisite' | 'badly-written'` (`REVIEW_FLAGS` in
  `src/core/reviews`).
- `Review` and `ReviewDraft` gain `flag: ReviewFlag | null` and `prerequisiteOf: string | null`.
- `FlagPolicy`: `{ schedule: (card: Card, grade: Grade, now: Date) => Card; hidesUntilTomorrow: boolean; countsAsIntroduced: boolean }`.
- `CardEdit`: `card` plus an optional subset of `type`, `question`, `answer`, `keyPoints`,
  `situation`, `tags`.
- `CardRepository` gains `update(card: Card): void`.
