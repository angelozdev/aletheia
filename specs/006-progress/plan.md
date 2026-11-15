# Implementation Plan: Progress

**Branch**: `006-progress` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-progress/spec.md`

## Summary

Three read commands, `tag stats`, `card list` and `review history`, give the progress tree, the
cards behind it and the reviews of a window. A new pure unit, `src/core/progress`, derives every
number from the active cards and the whole review log on each call: retention over the counted
reviews of the last 30 days, weak cards at 4 failures ever, gaps, due today and new. The flag
policies gain `countsInStats`, so a voided review never counts. A new local skill,
`aletheia-stats`, turns Angelo's questions into those commands and quotes what they print. No
migration, no new dependency, no ADR. Decisions are in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged)

**Primary Dependencies**: none added. `zod` 4.6.7 at the edge, `@toon-format/toon` 4.4.0,
`date-fns` behind `#core/time` (unchanged)

**Storage**: unchanged. Reads `cards`, `card_tags` and `reviews` through
`StoreCardRepository.active()` and `StoreReviewRepository.since(EVER)` (R7); writes nothing

**Testing**: vitest. Core units for the rules of data-model.md with a fixed clock. CLI tests
through `main()` on temp stores, each checking that the store's row counts are unchanged. One
performance test on an arranged store (R8). The skill file read as text. Every scenario
`006-USx-ASy` names its test

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skill

**Project Type**: CLI, one package, plus a new local skill

**Performance Goals**: each command under 1 s on 1,000 cards and 20,000 reviews (SC-003); the
suite stays near 5 s

**Constraints**: `src/core` pure; only `src/shell/db` knows SQLite and Drizzle (ADR-0010);
numbers as flags; no network; no test touches `data/`, `~/.aletheia/` or the installed
`aletheia` (INV-01)

**Scale/Scope**: one user. Three commands, one core unit, one policy field, one time helper,
one skill

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.6.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Each step ends in a question Angelo can ask: "¿cómo voy?", "¿y de aws?", "¿qué no repaso hace un mes?", "¿qué fallé esta semana?". |
| II. Facts in code, judgment in Claude | Pass. Retention, weak, gaps, due, the windows, the sorts and the counts are core code with tests. Picking the query and saying what it means are the skill's. |
| III. Pure core, single writer, nothing deleted | Pass. The core takes `now`, `today`, `tomorrow` and `windowStart` from the shell; the commands write nothing, checked by row counts. |
| IV. Test-driven, spec-anchored | Pass. Eleven scenarios, each named in a test, plus SC-003 as a test. No eval before a second real failure. |
| V. Small slices, one-page specs | Pass, at the edge: four steps and a close. Step 4 (US3, P3) can move to its own slice if the first three take the two days. |
| VI. Simplicity and YAGNI | Pass. Statistics derived, not stored; no repository method added (R7); no per-card retention, mastered cards or thresholds in settings (R11). |
| VII. English system, Spanish content | Pass. Commands, fields and docs in English; the skill speaks Spanish and its triggers are Spanish. |
| VIII. Conversation, not commands | Pass. Every trigger is a Spanish question; the skill runs `aletheia` for every answer. |
| IX. Quality over volume | Pass. The weak list feeds prune (slice 7), which acts only with Angelo's approval. |
| Technology Constraints | Pass. Options validated with `zod`; output TOON, JSON with `--json`. |
| ADRs | 0002–0018 `accepted` and respected; no new ADR (no storage, dependency or architecture change). |

Re-check after Phase 1: unchanged. The data model adds no table; the contract adds three
read-only commands and changes no existing output.

## Project Structure

### Documentation (this feature)

```text
specs/006-progress/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

Only touched files are listed; slices 0 to 5 stand.

```text
src/
├── core/
│   ├── progress/       new: tag rows, card rows, history and counts
│   ├── reviews/        FlagPolicy gains countsInStats
│   ├── tags/           exports coveredTags and bySegments
│   └── time/           startOfDaysAgo
└── shell/cli/
    ├── main/           Flags take booleans; three commands registered
    └── commands/
        ├── tag-stats/
        ├── card-list/
        └── review-history/
.claude/skills/aletheia-stats/SKILL.md
tests/skills/stats-skill.test.ts
tests/progress/performance.test.ts
```

**Structure Decision**: unchanged. One package, a functional core and an imperative shell in
concept folders (ADR-0004), one folder per module (ADR-0007), and the store opaque outside
`src/shell/db` (ADR-0010).

## Delivery order (vertical slices for `/speckit-tasks`)

Before step 1, in their own commits: Angelo accepts the commands and options (R1, R2), and the
design catches up (R10).

1. **How each topic is going** (006-US1-AS1 to AS3, AS6). `tag stats` with no tags and no
   sort, `countsInStats`, `startOfDaysAgo`, `coveredTags`, and the rows of data-model.md. The
   skill is born with its triggers, its rules and the tree. The performance test starts with
   `tag stats`. Run: quickstart §1.
2. **Filter and sort the tree** (006-US1-AS4, AS5). `[tags...]`, `--sort`, `--desc`, and
   `Flags` taking booleans; the skill passes a topic's tags and a sort ("¿cuál va peor?").
   Run: quickstart §2.
3. **Which cards** (006-US2-AS1 to AS4). `card list` with its filters and sort; the skill
   turns a free-form question into them, or says none answers. The performance test gains it.
   Run: quickstart §3.
4. **How the reviews went** (006-US3-AS1, AS2). `review history` with its window, filters and
   counts; the skill quotes the counts. The performance test gains it. Run: quickstart §4.
5. **Close**: `CLAUDE.md` names the commands and this contract. Then the merge,
   `pnpm release` (Angelo), quickstart §5 and its Measures.

No step is a layer on its own: each brings a command, its core rules and the skill text that
uses it, and ends in a question Angelo can ask in `test`. Steps 2 to 4 reuse step 1's per-card
facts, so they come after it; 3 and 4 do not depend on each other.

## Complexity Tracking

No violations to justify.
