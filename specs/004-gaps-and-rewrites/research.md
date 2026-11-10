# Research: Gaps and Rewrites

Decisions marked **Angelo** were his, in the spec's Clarifications; the rest wait for his review
with ADR-0017. Nothing here needs a new dependency.

## R1. Two optional fields on `review grade`, one new command `card edit`

- **Decision**: `review grade` takes two optional fields, `flag` (`missing-prerequisite` or
  `badly-written`) and `prerequisiteOf` (a card id). `aletheia card edit` takes one object on
  stdin through a quoted heredoc: `card`, the id, and any of `type`, `question`, `answer`,
  `keyPoints`, `situation` and `tags`, with the rules of `card add`. It prints the card as
  `card show` does (contracts/cli.md).
- **Rationale**: a flag belongs to the grade Claude is recording, so it travels with it; one
  `flag`, not a list, makes "never both" the field's shape. An edit is free text, so it is JSON
  on stdin like every command that writes card content (spec 003 Clarifications). Printing the
  edited card lets Claude read it back without a second call.
- **Alternatives**: `review void <id>` and `review gap <id>` as separate commands (two writes
  for one review, and a moment where the grade is recorded without its flag); `flags: []`
  (a list whose only valid lengths are 0 and 1); `card rewrite` (the same command; "edit"
  covers a fix asked outside a voided review too).

## R2. The review log: two nullable columns, rebuilt, triggers restored

- **Decision** (ADR-0017, proposed): `reviews` gains `flag` and `prerequisite_of`, with
  `CHECK`s for the flag's values, a gap being Again, and a card not being its own prerequisite;
  `prerequisite_of` references `cards(id)`. `drizzle-kit generate` rebuilds the table to add the
  `CHECK`s (seen in a spike: create `__new_reviews`, copy, drop, rename), which drops
  `reviews_never_deleted` and `reviews_never_changed`; a custom migration right after it
  creates both again. A voided review is a `flag` of `badly-written`, with no column of its own.
- **Rationale**: the rules are plain `CHECK`s Drizzle declares; reviews from before the slice
  read as unflagged without a backfill. The existing tests that the store refuses to delete or
  change a review run over every migration, so the lost triggers fail them until restored.
- **Alternatives**: a JSON array or a flags table (ADR-0017); hand-editing the generated SQL to
  append the triggers (generated output is reviewed, not rewritten; constitution VI).

## R3. A voided review records the card as it was

- **Decision**: `gradeCard` records a review flagged `badly-written` with the card unchanged:
  no `scheduleAfter`, so due, state, steps, reps, lapses, stability, difficulty and last review
  stay. The store writes the same schedule back in the review's transaction. `review grade`
  prints the same four fields as ever; for a voided review `state` and `due` are the card's
  old ones.
- **Rationale**: the schedule is untouched by construction, not by undoing an update.
  `lastReview` stays too, so a topic review today still sees the card as not graded today; the
  rule that hides it is R4's.
- **Alternatives**: scheduling and then restoring (two writes that could drift); a `voided`
  output field (the skill already knows it voided the review).

## R4. A card voided today leaves every list until tomorrow

- **Decision**: `sessionList` removes from the scope every card with a review flagged
  `badly-written` since the start of the local today, before the due list runs, as it does
  with held-back new cards. When any is removed, `nextDue` is at most the start of tomorrow,
  the same rule as held-back cards. The reviews it reads already reach back to the local today.
- **Rationale**: Angelo has seen the answer; showing it again today, in this session or the
  next, only tests what he just read. Removing it before `dueList` keeps the learn-ahead rule
  right, as R5 of spec 003 does for held-back cards; without the `nextDue` rule, a voided card
  due yesterday would print a `nextDue` in the past.
- **Alternatives**: leaving it out for the rest of the session only (it would come back in the
  next session of the same day); hiding it in the skill (a business rule in a prompt).

## R5. What counts toward the two caps

- **Decision**: in `src/core/sessions`:
  - *Shown in the session*: every card with a review since the session began. They are the
    re-shows when due again, as before.
  - *Counted toward the cap*: those, minus the cards whose first review in the session names a
    `prerequisiteOf`. The fill starts after the counted cards, and `capReached` compares them
    with the size. A voided review counts.
  - *Introduced today*: reviews since the local today whose `stateBefore` is `new`, minus those
    flagged `badly-written` and those naming a `prerequisiteOf`.
- **Rationale**: a pulled prerequisite is outside the session's plan (spec FR-003), so neither
  cap sees it, even when it comes back as a re-show; judging by its first review in the session
  keeps a later re-show from counting it. A voided review costs a place in the session, since
  every card shown costs context, but schedules nothing, so it introduces no card.
- **Alternatives**: counting every distinct card (a prerequisite at the 20th card would show a
  21st without asking, against 003 SC-002); exempting by the card's `source` (a created
  prerequisite is not pulled, and follows the daily cap: spec Assumptions).

## R6. `prerequisiteOf` is checked at the edge and in the core

- **Decision**: zod refuses a `prerequisiteOf` equal to `card` (`must be another card`) and a
  `flag` of `missing-prerequisite` with a final grade other than Again
  (`missing-prerequisite needs the grade again`), with the other field messages, in one line.
  The core looks up the `prerequisiteOf` card through `cardById` before recording, so an
  unknown id is `card "<id>" not found`, as for `card`. The store's `CHECK`s and foreign key
  refuse the same, underneath.
- **Rationale**: every rule SQL can say is in the store (constitution III); the CLI names the
  problem first, in Angelo's terms. `cardById` already throws the error the contract shows.

## R7. An edit replaces the content and the tags, and the search follows

- **Decision**: `src/core/cards` gains `editCard(id, changes, deps)`: it finds the card, applies
  the fields given, sets `updatedAt` to now, and saves it through a new port method
  `CardRepository.update(card)`. The adapter updates the content columns and `updated_at`, and
  replaces the card's rows in `card_tags`, in one transaction; it never writes the schedule. A
  custom migration adds `card_search_on_update`, `AFTER UPDATE OF question, answer, key_points,
  situation ON cards`, which rewrites the card's row in `card_search`. The edit keeps no copy
  of the old text (**Angelo**).
- **Rationale**: ADR-0014 named the update trigger as this slice's cost. Firing it only on the
  text columns keeps grading, which updates the schedule on every review, off the index. The
  field rules are `card add`'s, shared rather than copied.
- **Alternatives**: rewriting the index row from the adapter (two places that must remember
  the index); an edit history (rejected by **Angelo**).

## R8. Archived cards are not refused yet

- **Decision**: `card edit` and `prerequisiteOf` accept any existing card. Every card is active
  until slice 7 brings archive; that slice refuses an edit on an archived card.
- **Rationale**: no test can reach an archived card in this slice, so the check would be code
  without a test (constitution IV).

## R9. The skill holds the judgment

- **Decision**: `.claude/skills/aletheia-review/SKILL.md` gains three sections:
  - *A missing base concept*: grade Again with the flag; search with `aletheia card search`
    (the concept plus synonyms in Spanish and English, and the failed card's tags); read the
    results and judge whether one covers it; if one does and was not shown in the session, ask
    it next without explaining first and record it with `prerequisiteOf`; otherwise explain in
    two or three lines and offer the card through `az-aletheia-add`, source `repaso #<id>`.
    One prerequisite per failed card; a prerequisite that fails for a base concept is flagged
    and explained, and pulls nothing.
  - *The wording decided it*: when the question can be read two ways, lacks context it should
    carry, asks something other than its key points or gives its answer away, right or wrong
    (**Angelo**), say why in a line, grade with `badly-written`, and propose a rewrite. Angelo
    may dispute a voiding, or ask for one, as he disputes a grade.
  - *A rewrite*: only for the same knowledge; show the exact before and after; run
    `aletheia card edit` only after Angelo approves, with his edits; a fix that changes what the
    key points mean needs a replacement, which arrives with slice 7.
- **Rationale**: telling a gap from bad wording and judging coverage are judgment
  (constitution II); the tests read the skill file as text, as in slices 1 to 3.

## R10. The design and the old fixtures catch up

- **Decision**: before step 1, design §5 says a review carries at most one flag and, when it was
  asked as a prerequisite, the card it was asked for; in its own commit. `Review` gains `flag`
  and `prerequisiteOf`, both `null` when absent: the typed review fixtures in
  `src/core/sessions/sessions.test.ts` and `src/shell/db/reviews/reviews.test.ts` gain the two
  `null`s. Their assertions do not change.
- **Rationale**: the constitution changes the design first; a fixture gaining a field it lacked
  is not a weakened test.
