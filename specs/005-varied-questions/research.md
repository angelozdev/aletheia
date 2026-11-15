# Research: Varied Questions

Decisions marked **Angelo** were his, in the spec's Clarifications; he approved the rest
with ADR-0018 on 2026-11-14. Nothing here needs a new dependency.

## R1. One required field on `review grade`: `askedQuestion`

- **Decision**: `review grade` takes `askedQuestion`, required text that is not blank: the last
  wording Claude asked before Angelo answered (**Angelo**). Its output is unchanged, and no
  command prints the field in this slice; stats reads it in slice 6.
- **Rationale**: the question belongs to the grade being recorded, so it travels with it, as
  the flag does (spec 004 R1). `askedQuestion` cannot be mistaken for the card's `question`,
  which `card show` prints; a field named `question` invites Claude to send the stored one.
- **Alternatives**: `question` (the card's field name with another meaning); `asked` (unclear
  on its own); a command of its own (two writes for one review, and a moment where the grade is
  recorded without its question).

## R2. One nullable column, `asked_question`, never blank

- **Decision** (ADR-0018): `reviews` gains `asked_question text` with
  `CHECK (asked_question IS NULL OR length(trim(asked_question)) > 0)`, through `notBlank`.
  `null` is left for the reviews recorded before the slice; the CLI refuses a new review
  without it (**Angelo**).
- **Rationale**: SQL cannot tell an old review from a new one, so `NOT NULL` would need a
  backfill, and the spec has none. The `CHECK` still refuses a blank question underneath the
  CLI (constitution III).
- **Alternatives**: `NOT NULL` with the old rows filled from the card's current question (a lie:
  a card rewritten in slice 4 no longer has the question it was asked with, and none was asked
  rephrased); a `review_questions` table (a join for one text, and "required" still out of
  SQL's reach).

## R3. `badly-rephrased` is one more flag, with `badly-written`'s policy

- **Decision**: `REVIEW_FLAGS` gains `badly-rephrased`. In `FLAG_POLICIES` it shares one voided
  policy with `badly-written`: the card keeps its schedule, is hidden until tomorrow, and
  introduces no card. Any grade goes (**Angelo**). The zod enum and the store's `reviews_flag`
  follow `REVIEW_FLAGS`: `must be missing-prerequisite, badly-written or badly-rephrased`.
  Nothing else in the core changes: `gradeCard` and `sessionList` already read the policy.
- **Rationale**: spec 004 R11 built the policy table for this flag: the `Record` does not
  compile until it is declared, and its effects live in one place.
- **Alternatives**: `badly-written` with the cause in the rationale (stats and prune would take
  Claude's rephrasing for a badly written card, design §8.2 step 16); a `voided` column plus a
  cause (rejected in ADR-0017).

## R4. Two rebuilds, each with its triggers restored

- **Decision**: steps 1 and 2 each change the `CHECK`s on `reviews`, so `drizzle-kit generate`
  rebuilds the table twice. Each generated migration is followed by a custom one that creates
  `reviews_never_deleted` and `reviews_never_changed` again, with the SQL of
  `20261110005603_reviews_never_change`. Before committing a generated migration, read its
  `INSERT INTO __new_reviews`: it must copy every column the table already has, `flag` and
  `prerequisite_of` included, and `asked_question` in the second.
- **Rationale**: one rebuild per behavior keeps each step vertical, at the cost of two more
  migration folders. The release backs up `prod` and then applies all four in order. The two
  INV-02 tests in `src/shell/db/reviews/reviews.test.ts` go red until each restore.
- **Alternatives**: one rebuild in step 1 for both (adding the flag there forces its policy and
  message into a step that does not test them); rewriting step 1's migration in step 2 (it is
  already applied to `data/test.sqlite`).

## R5. The rebuild is tested on a store that holds reviews

- **Decision**: a store test applies the shipped migrations up to
  `20261110202019_card_search_on_update`, the last one released, to a temp store. Through
  `tests/support/store` it inserts a card and reviews with and without `flag` and
  `prerequisite_of`, then opens the store with every shipped migration. Each review must read
  back unchanged, with `asked_question` null. The test is named under INV-02.
- **Rationale**: slice 4's rebuild only ran on empty test stores, while `prod` holds real
  reviews. `openTestStore` already takes a migrations folder.
- **Alternatives**: trusting the release's backup (it lets Angelo restore; it catches nothing);
  migrating a copy of the `prod` backup by hand (the test covers the same, and INV-01 keeps
  tests away from `~/.aletheia/`).

## R6. The skill rephrases, records, and tells which wording decided

- **Decision**: `.claude/skills/aletheia-review/SKILL.md` changes in three places:
  - *One question at a time*: every question is rephrased. The rephrasing asks for the same key
    points, names the technology and the variant, keeps code, commands and flags verbatim, and
    gives no hint the stored question does not give. It differs from the stored wording and
    from the wordings asked earlier in this session, a re-show included. The question is asked
    as stored when no rewording keeps what it asks, or when Angelo asks for it ("pregúntamela
    como está"), and rephrasing resumes on the next card. When Angelo does not understand,
    Claude rewords before he answers. The grade checks the stored key points; the answer shown
    is the stored one.
  - *Settle and record the grade*: every `review grade` example carries `askedQuestion`, the
    last wording asked before Angelo answered.
  - *The wording decided it*: when only the rephrasing decided the answer, right or wrong,
    record `badly-rephrased` and propose no rewrite. When the stored wording would have decided
    it too, record `badly-written` and propose a rewrite (spec 004). Say why in a line. Angelo
    may dispute either flag, or ask for one.
- **Rationale**: rephrasing and telling one wording from the other are judgment (constitution
  II). The tests read the skill file as text; each tested phrase stays on one line. The
  examples gain `askedQuestion` in the same step as the CLI requires it, or the first review
  after the release exits 1.

## R7. What is not built

- No command prints the asked question: stats arrives in slice 6. SC-003 holds by
  construction, since the CLI refuses a review without it (005-US1-AS2).
- No check that `askedQuestion` differs from the card's question (spec Assumptions).
- No change to the output of `review grade`, `card show` or the lists.

## R8. The design and the old fixtures catch up

- **Decision**: before step 1, design §5 says the review log keeps the question as asked
  (`null` before slice 5) and that the flag is `missing-prerequisite`, `badly-written` or
  `badly-rephrased`, the last two voided. This goes in its own commit. `Review` gains
  `askedQuestion: string | null` and `ReviewDraft` gains `askedQuestion: string`. The review
  fixtures gain the field: `REVIEW` in `src/shell/db/reviews/reviews.test.ts`, `graded()` in
  `src/core/sessions/sessions.test.ts`, and the `review grade` JSON in the CLI tests of
  `review-grade`, `review-due`, `review-topic` and `card-edit`. No assertion changes.
- **Rationale**: the constitution changes the design first; a fixture gaining a field it lacked
  is not a weakened test (spec 004 R10).
