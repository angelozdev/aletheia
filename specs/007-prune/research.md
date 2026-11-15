# Research: Prune

Decisions marked **Angelo** were his, in the spec's Clarifications. The commands and options
(R1) are public interface and the store shape (R2, ADR-0019) is hard to reverse: Angelo
accepted both on 2026-11-15, the archive reason as JSON on stdin and the history table under
the name `card_status_history`. No new dependency.

## R1. Four card commands, three flags and four outputs that grow

- **Decision**:
  - `aletheia card archive` reads `{ "card": "<id>", "reason": "<text>" }` on stdin and prints
    the card as `card show` does. `aletheia card restore <id>` prints it back, active.
  - `aletheia card keep <id> --reason <reason> [--overlaps <id>]` prints the keep. Reasons:
    `leech`, `not-useful`, `outdated-situation` and `overlapping`; `--overlaps` goes with
    `overlapping` and only with it.
  - `aletheia card candidates [tags...]` gives the CLI's candidates and the keeps of the last
    `keep-months` (`kept`), for the skill to skip what Angelo kept for its own reasons.
  - `card list --content` adds `keyPoints` and `situation` to each row (US3).
  - `review grade` accepts `"flag": "not-useful"`. `settings set` takes `--leech-failures <n>`
    and `--keep-months <n>`.
  - Outputs that grow: `card show` gains `archivedAt` and `archiveReason`; `card search` items
    gain `status` and `archiveReason`; `tag stats`'s `deck` gains `candidates`; `review history`
    counts `not-useful`; `settings show` lists five settings.
- **Rationale**: each acts on a card or lists cards, so each joins `card`, read `<what> <verb>`
  as the rest. Free text goes as JSON on stdin and the rest as arguments and flags (design §9),
  as `review grade` and `review history` do. The reasons are the spec's, in kebab-case, the
  shape of the flags. Keeps live with the candidates because both are prune's; `card list`
  stays a list of cards.
- **Alternatives**: a `prune` group (`prune archive`, `prune keep`: a second home for what acts
  on one card); `card archive <id> --reason "…"` (Spanish text through shell quoting);
  `card read [tags...]` for US3 (a second card list); the keeps inside `card list --content`
  (each row would carry prune's bookkeeping).

## R2. Archive, restore and keep as append-only logs (ADR-0019, Angelo)

- **Decision**: `cards.status` stays the card's current status, the one every list filters on.
  Two new tables, each refused a delete or an update by trigger (INV-03):
  - `card_status_history(id, card_id, status, reason, changed_at)`: one row per archive or restore;
    `reason` is not blank for `archived` and `null` for `active`. The repository writes the row
    and `cards.status` in one transaction.
  - `keeps(id, card_id, reason, overlaps, kept_at)`: `reason` one of the four; `overlaps` a card
    other than `card_id`, present exactly when the reason is `overlapping`.
- **Rationale**: the spec records every archive, restore and keep and overwrites none
  (Assumptions); a restore keeps the reason the card was archived for. The lists read one
  column, as today. It is the usual current state plus status history, the same pairing as
  `cards`' schedule and `reviews`; `cards.status` is deliberately denormalized, since every
  list reads it and only archive and restore write it.
- **Alternatives**: `archived_at` and `archive_reason` columns on `cards` (a restore erases
  them); one `card_decisions` log for all three (every `CHECK` conditional on a kind column);
  `cards.status` derived from the log (every list joins it).

## R3. An archived card refuses what only an active card does

- **Decision**: `#core/cards` gains `activeCardById`, which throws `CardArchivedError`
  (`card <id> is archived`). `gradeCard` uses it for the card and its `prerequisiteOf`,
  `editCard` and `keepCard` for theirs, and archiving for the card. Restoring an active card
  throws `CardNotArchivedError` (`card <id> is not archived`).
- **Rationale**: one check, beside `cardById`, for 007-US1-AS2 to AS4 and 007-US4-AS1.
- **Alternatives**: each command checking `status` itself (four copies of one rule).

## R4. Candidates, in a new core unit

- **Decision**: `src/core/prune` computes, over the active cards in scope, every review and the
  keeps:
  - a **leech**: failures (006 R4's rule, moved to `#core/reviews` so both units read it)
    reach `leechFailures`, unless its latest `leech` keep is later than its last failure;
  - **not useful**: it has a review flagged `not-useful`, unless a `not-useful` keep is within
    the last `keepMonths`;
  - each candidate once, with `reasons` (`leech`, then `not-useful`), `failures`,
    `lastFailure`, and `notUseful` (instant and rationale of the latest such review, or
    `null`), in the order the cards were saved;
  - `kept`: the keeps of the cards in scope within the last `keepMonths`, newest first.
  `tagProgress` counts the candidates of its scope into `deck.candidates`.
- **Rationale**: the rules of 007-US1-AS1, US2-AS2 and US4-AS2, read from the log as 006 reads
  retention (constitution VI). Moving the failure rule keeps one definition and no import
  cycle (progress → prune → reviews).
- **Alternatives**: candidates inside `src/core/progress` (it would mix "how am I doing" with
  "what to prune"); storing a candidate flag on the card (a statistic stored).

## R5. `not-useful` counts like no flag

- **Decision**: `REVIEW_FLAGS` gains `not-useful`, with policy `NO_FLAG` (spec 004 R11). The
  `reviews_flag` `CHECK` changes, so the generated migration rebuilds `reviews`, and a custom
  one right after restores `reviews_never_deleted` and `reviews_never_changed`, as slice 5 did.
- **Rationale**: 007-US2-AS1; ADR-0017 foresaw the rebuild and its trap. No new ADR.

## R6. Two settings, and weak reads the leech one

- **Decision**: `settings` gains `leech_failures` and `keep_months`, nullable, each
  `CHECK (… IS NULL OR … >= 1)` (ADR-0016). `BUILT_IN_SETTINGS` gains `leechFailures: 3`
  (**Angelo**) and `keepMonths: 6`; `WEAK_FAILURES` goes, and `weak` in `tag stats` and
  `card list` reads `leechFailures`. Neither takes a one-call flag.
- **Rationale**: 007-US5-AS1 and the spec's leech at 3. The tests of slices 3 and 6 that pin
  the three settings or "4 failures weak, 3 not" are restated at five settings and "3 weak, 2
  not": the rule changed by Angelo's decision, not to make a test pass.
- **Alternatives**: one-call flags on `card candidates` (no story).

## R7. The keep window is counted in local months

- **Decision**: `#core/time` gains `monthsBefore(now, months, timeZone)`: the same local
  instant `months` months earlier. Six months before 2026-12-01 10:00 is 2026-06-01 10:00.
- **Rationale**: "six months" as Angelo counts them, across daylight saving.

## R8. Where an archived card still shows

- **Decision**: lists that read `active()` drop it with no change: `review due`,
  `review topic`, `tag list`, `tag stats`, `card list`, `card candidates`. `card show` reads it
  with its latest status change. `review history` reads reviews over every card (a new
  `CardRepository.all()`), so an archived card's reviews stay; its tags are checked against
  every card, so a tag left with only archived cards still gives their reviews. `card search` matches words over every card; cards sharing only a
  tag family stay active ones.
- **Rationale**: 007-US1-AS2 and AS7; the Measures of slices 4 and 5 count every review.

## R9. Skills

- **Decision**: a new local `aletheia-prune` (`.claude/skills/aletheia-prune/`): Spanish
  triggers ("podemos el mazo", "poda <tema>", "limpiemos el mazo", "archiva #…", "devuélveme #…");
  the CLI's candidates first, one at a time, waiting for Angelo after each; then the reading,
  topic by topic, with `PROFILE.md` read-only; every write through the installed `aletheia`
  only after his choice. `aletheia-review` gains the `not-useful` flag, `aletheia-stats` the
  candidate count and the leech setting in place of "4 failures", and `az-aletheia-add` the
  archived match, which reaches `prod` with the release.
- **Rationale**: FR-006 and the skill scenarios; one candidate at a time, as the review asks
  one question at a time.

## R10. Performance

- **Decision**: `tests/progress/performance.test.ts` gains `card candidates`, under 1 s on
  1,000 cards and 20,000 reviews (SC-004).

## R11. Not in this slice

Replace, split and merge, and a rewrite that changes what the key points mean (slice 8);
mastered (**Angelo**); a note on a keep or a restore; a candidate count per tag; one-call
threshold flags.
