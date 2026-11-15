# Data Model: Varied Questions

Adds to [slice 4's model](../004-gaps-and-rewrites/data-model.md). Decisions in
[research.md](./research.md).

## Review (table `reviews`)

| Column | Type | Rule |
|---|---|---|
| `asked_question` | text, null, new | `null`, or text that is not blank (`reviews_asked_question`) |
| `flag` | text, null | gains `badly-rephrased`: `null`, `missing-prerequisite`, `badly-written` or `badly-rephrased` |

- Every review from before the slice reads `asked_question = null`. Every review recorded from
  the slice on carries it, because the CLI refuses one without it (R1). SQL only refuses a
  blank one.
- The **question as asked** is the last wording Claude asked before Angelo answered. The card's
  `question` does not change.
- A **voided review** is one flagged `badly-written` or `badly-rephrased`. Both are kept like
  any review and change nothing in their card's schedule.

Migrations, in order (R4):

1. Generated (step 1): adds `asked_question` and its `CHECK`, rebuilding `reviews`.
2. Custom: `reviews_never_deleted` and `reviews_never_changed` again.
3. Generated (step 2): `reviews_flag` gains `badly-rephrased`, rebuilding `reviews`.
4. Custom: the two triggers again.

## Rules in the core

`src/core/reviews`, one policy per flag (spec 004 R11). The new row:

| Flag | `schedule` | `hidesUntilTomorrow` | `countsAsIntroduced` |
|---|---|---|---|
| `badly-rephrased` | keeps the card as it was | true | false |

It is the same policy object as `badly-written`'s. `sessionList` and `gradeCard` do not change:
they read the policy.

`gradeCard` records `draft.askedQuestion` with the review.

## Types

- `ReviewFlag`: `'missing-prerequisite' | 'badly-written' | 'badly-rephrased'`.
- `Review` gains `askedQuestion: string | null`.
- `ReviewDraft` gains `askedQuestion: string`.
