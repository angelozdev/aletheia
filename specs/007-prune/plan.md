# Implementation Plan: Prune

**Branch**: `007-prune` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-prune/spec.md`

## Summary

Angelo retires a card with `card archive` and his reason, and gets it back with
`card restore`; the card leaves every list and progress but stays in `card show`, the review
history and the duplicate search. `card candidates` gives the leeches (3 failures, a setting)
and the cards he called useless in a review (a new `not-useful` flag), less what he kept with
`card keep`, which holds until a later failure or the keep's months (6, a setting). The store
records archive, restore and keep in two append-only logs beside `cards.status` (ADR-0019). A new local skill, `aletheia-prune`, lists the candidates one at a time, reads the
deck topic by topic for outdated situations and overlaps, and writes only on Angelo's choice;
the review, stats and add skills learn their part. Decisions are in
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged)

**Primary Dependencies**: none added. `zod` 4.6.7 at the edge, `@toon-format/toon` 4.4.0,
`date-fns` and `@date-fns/tz` behind `#core/time` (unchanged)

**Storage**: SQLite through `node:sqlite` and Drizzle. New tables `card_status_history` and
`keeps`, two columns on `settings`, a `CHECK` change on `reviews.flag` (rebuild and triggers
restored), triggers for INV-03; four generated or custom migrations (data-model.md)

**Testing**: vitest. Core units for candidates, keeps and the flag policy with a fixed clock.
CLI tests through `main()` on temp stores. Store tests for INV-02 and INV-03 through
`tests/support/store`. The skill files read as text. The performance test gains
`card candidates`. Every scenario `007-USx-ASy` and INV-03 names its test

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skills

**Project Type**: CLI, one package, plus a new local skill and three changed skills

**Performance Goals**: `card candidates` under 1 s on 1,000 cards and 20,000 reviews (SC-004);
the suite stays near 5 s

**Constraints**: `src/core` pure; only `src/shell/db` knows SQLite and Drizzle (ADR-0010);
free text as JSON on stdin, the rest as arguments and flags; no test touches `data/`,
`~/.aletheia/` or the installed `aletheia` (INV-01)

**Scale/Scope**: one user. Four new commands, seven changed outputs, one core unit, two
settings, one flag, two tables, one new skill and three skill changes

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.6.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Step 1 ends in "archiva #…" and "devuélveme #…"; each later step adds something Angelo runs in `test`. |
| II. Facts in code, judgment in Claude | Pass. Leech, not useful, keeps, windows and counts are core code with tests. Outdated situations, overlaps and every choice are the skill's and Angelo's. |
| III. Pure core, single writer, nothing deleted | Pass. Archiving deletes nothing and keeps the schedule and reviews; restore undoes it; blank reasons, unknown keep reasons and self-overlaps are refused by `CHECK`; the new logs refuse delete and update (INV-03). |
| IV. Test-driven, spec-anchored | Pass. Sixteen scenarios and INV-03, each named in a test, plus SC-004 as a test. No eval before a second real failure. |
| V. Small slices, one-page specs | Pass, at the edge: seven steps and a close, after replace, split and merge moved to slice 8 (**Angelo**). Steps 6 and 7 (P2, P3) can move to their own slice if the first five take the two days. |
| VI. Simplicity and YAGNI | Pass. Candidates derived from the log, not stored; mastered dropped (**Angelo**); no one-call threshold flags, no notes on keeps (R11). |
| VII. English system, Spanish content | Pass. Commands, fields and docs in English; reasons and skill output in Spanish. |
| VIII. Conversation, not commands | Pass. Every trigger is Spanish; the skills run `aletheia` for every fact. |
| IX. Quality over volume | Pass. This slice is the quality loop: nothing leaves the deck without Angelo's choice and reason. |
| Technology Constraints | Pass. Input validated with `zod`; output TOON, JSON with `--json`. |
| ADRs | 0002–0018 `accepted` and respected; ADR-0017's rebuild trap handled as in slice 5; ADR-0019 accepted by Angelo on 2026-11-15. |

Re-check after Phase 1: unchanged. The data model adds two logs and two settings and changes
one `CHECK`; the contract adds four commands and grows seven outputs, none removed.

## Project Structure

### Documentation (this feature)

```text
specs/007-prune/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
docs/adr/0019-archive-restore-and-keep-as-append-only-logs.md
```

### Source Code (repository root)

Only touched files are listed; slices 0 to 6 stand.

```text
src/
├── core/
│   ├── cards/          activeCardById, CardArchivedError, CardNotArchivedError, archive, restore
│   ├── prune/          new: candidates, kept, keepCard, KEEP_REASONS, KeepRepository
│   ├── progress/       weak reads leechFailures; deck.candidates
│   ├── reviews/        not-useful flag; isCounted and isFailure moved here
│   ├── settings/       leechFailures, keepMonths
│   └── time/           monthsBefore
└── shell/
    ├── db/
    │   ├── cards/      card_status_history schema; archive, restore, all(); search over archived
    │   ├── keeps/      new: keeps schema, StoreKeepRepository
    │   ├── reviews/    flag CHECK
    │   └── settings/   two columns
    └── cli/commands/
        ├── card-archive/  card-restore/  card-keep/  card-candidates/   new
        └── card-show/  card-list/  card-search/  tag-stats/  review-history/  settings-set/  settings-show/
migrations/             four new
.claude/skills/aletheia-prune/SKILL.md          new
.claude/skills/aletheia-review/SKILL.md         not-useful
.claude/skills/aletheia-stats/SKILL.md          candidate count, leech setting
skills/az-aletheia-add/SKILL.md                 archived match
tests/skills/prune-skill.test.ts                new
tests/progress/performance.test.ts
```

**Structure Decision**: unchanged. One package, a functional core and an imperative shell in
concept folders (ADR-0004), one folder per module (ADR-0007), the store opaque outside
`src/shell/db` (ADR-0010), one repository per store opened.

## Delivery order (vertical slices for `/speckit-tasks`)

Angelo accepted the commands and options (R1) and ADR-0019 (R2) on 2026-11-15. The design
caught up the same day (`4a79fa9`).

1. **Archive a card and get it back** (007-US1-AS2 to AS4, INV-03 for `card_status_history`).
   `card_status_history` and its triggers, `card archive`, `card restore`, `card show`'s two fields,
   `activeCardById` in grade and edit, `review history` over every card. The prune skill is
   born with its triggers and the archive and restore Angelo asks for by id (part of
   007-US1-AS6). Run: quickstart §1.
2. **A pruned card does not come back unnoticed** (007-US1-AS7). `card search` over archived
   cards, with `status` and `archiveReason`; `az-aletheia-add` quotes the match and offers drop,
   save or restore. Run: quickstart §2.
3. **Leeches** (007-US1-AS1, AS5, AS6). `src/core/prune` with the leech rule, the failure rule
   moved to `#core/reviews`, the threshold at 3 (006's tests restated, R6), `card candidates`,
   `deck.candidates`; the skill lists candidates one at a time and offers archive, rewrite in
   place or leave; the stats skill names the count. The performance test gains the command.
   Run: quickstart §3.
4. **Said to be useless** (007-US2-AS1 to AS3). The flag, its migration and the restored
   triggers, the `not-useful` reason; the review skill flags it. Run: quickstart §4.
5. **A kept card is not proposed again** (007-US4-AS1 to AS3, INV-03 for `keeps`). `keeps`
   and its triggers, `monthsBefore`, `card keep`, the left-out rules and `kept`; the skill
   offers keep. Run: quickstart §5.
6. **What Claude finds by reading** (007-US3-AS1, AS2). `card list --content`; the skill reads
   `PROFILE.md` and each topic, proposes outdated situations and overlaps, skips what `kept`
   names, and for an overlap offers keep, archive one or leave. Run: quickstart §6.
7. **Tune the thresholds** (007-US5-AS1). The two settings, their columns and flags; the
   candidates, `weak` and the keep window read them. Run: quickstart §7.
8. **Close**: `CLAUDE.md` names the commands, this contract and the prune skill. Then the
   merge, `pnpm release` (Angelo), quickstart §8 and its Measures.

No step is a layer on its own: each brings a command or flag, its rules and the skill text
that uses it, and ends in something Angelo runs in `test`. Step 2 needs step 1's archive;
steps 4 and 5 add reasons and keeps to step 3's candidates; step 6 reads step 5's `kept`;
step 7 can follow any of 3 to 6.

## Complexity Tracking

| Exception | Why | Simpler option rejected |
|---|---|---|
| Moving `isCounted` and `isFailure` to `#core/reviews` (pure refactor, inside step 3) | prune and progress both read the failure rule, and progress counts prune's candidates | prune importing progress (an import cycle once progress counts candidates) |
