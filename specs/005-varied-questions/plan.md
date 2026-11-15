# Implementation Plan: Varied Questions

**Branch**: `005-varied-questions` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-varied-questions/spec.md`

## Summary

`review grade` requires `askedQuestion`, the question as Claude asked it, and accepts a third
flag, `badly-rephrased`. The store gains one nullable column, `asked_question`, never blank,
and the flag's `CHECK` gains the value; each change rebuilds `reviews`, and its triggers are
restored after each rebuild. The core gains no rule: `badly-rephrased` shares `badly-written`'s
policy (spec 004 R11), so voiding, hiding until tomorrow and both caps work as they already do.
The review skill rephrases every question, records the wording asked, and tells a bad
rephrasing from a badly written card. No new dependency. Decisions are in
[research.md](./research.md); [ADR-0018](../../docs/adr/0018-a-review-keeps-the-question-as-asked.md)
is proposed.

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged)

**Primary Dependencies**: none added. `zod` at the edge, `drizzle-orm` and `drizzle-kit`
1.0.0-rc.5 (unchanged)

**Storage**: `reviews` gains `asked_question`, and `reviews_flag` gains `badly-rephrased`. There
are two generated migrations that rebuild the table, each followed by a custom one restoring
its two triggers (R4). No new table

**Testing**: vitest. A core unit for the new flag's policy. CLI tests through `main()` on temp
stores. Store tests through `tests/support/store` for the new `CHECK`s, for the triggers
surviving both rebuilds, and for a store with reviews migrated from the last released migration
(R5). Skill files read as text. Every scenario `005-USx-ASy` names its test

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skill

**Project Type**: CLI, one package, plus the local review skill

**Performance Goals**: none new. The suite stays under 5 s

**Constraints**: `src/core` pure; only `src/shell/db` knows SQLite and Drizzle (ADR-0010);
free text as JSON on stdin; no network; no test touches `data/`, `~/.aletheia/` or the
installed `aletheia` (INV-01)

**Scale/Scope**: one user. One field and one flag value on one command, four migrations, one
skill file

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.6.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. After the release, Angelo's next review asks him a card he has seen, worded differently; step 2 adds a behavior he meets the first time a rephrasing misleads him. |
| II. Facts in code, judgment in Claude | Pass. Requiring the question, voiding, hiding until tomorrow and the caps are code with tests. Rephrasing, judging that a rephrasing keeps the key points, and telling which wording decided are left to the skill. |
| III. Pure core, single writer, nothing deleted | Pass. The store refuses a blank question and an unknown flag. No review is deleted or changed; the triggers are restored after each rebuild, and a store with reviews is migrated in a test (R5). |
| IV. Test-driven, spec-anchored | Pass. Six scenarios, each named in a test; INV-02 gains the migrated-store test. No eval before a second real failure. Fixtures gain `askedQuestion` with no assertion changed (R8). |
| V. Small slices, one-page specs | Pass. Two steps and a close. |
| VI. Simplicity and YAGNI | Pass. One column, one flag value, no command to print the question before stats needs it (R7), no stored variants (spec Assumptions). |
| VII. English system, Spanish content | Pass. Field, flag and docs are in English; the asked question and the skill's words to Angelo are in Spanish. |
| VIII. Conversation, not commands | Pass. Rephrasing happens with no command; "pregúntamela como está" and "esa pregunta la reformulaste mal" are plain Spanish. |
| IX. Quality over volume | Pass. A bad rephrasing never rewrites the card; a rewrite still needs Angelo's approval (spec 004). |
| Technology Constraints | Pass. The field is validated with `zod`; the custom migrations hold only triggers. |
| ADRs | 0002–0017 `accepted` and respected; 0017's warning about lost triggers is handled by R4. 0018 is `proposed`, to be accepted before step 1. |

Re-check after Phase 1: unchanged. The data model adds one column and one flag value with
`CHECK`s; the contract adds one required field and one enum value, and changes no output.

## Project Structure

### Documentation (this feature)

```text
specs/005-varied-questions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

Only touched files are listed; slices 0 to 4 stand.

```text
src/
├── core/
│   └── reviews/        REVIEW_FLAGS and FLAG_POLICIES gain badly-rephrased; Review, ReviewDraft gain askedQuestion
└── shell/
    ├── cli/commands/
    │   └── review-grade/   askedQuestion required
    └── db/reviews/     schema column and CHECK; record and since carry it
migrations/<ts>_asked_question/                generated
migrations/<ts>_reviews_never_change_after_asked_question/    custom
migrations/<ts>_badly_rephrased/               generated
migrations/<ts>_reviews_never_change_after_badly_rephrased/   custom
.claude/skills/aletheia-review/SKILL.md
tests/skills/review-skill.test.ts
```

**Structure Decision**: unchanged. One package, a functional core and an imperative shell in
concept folders (ADR-0004), one folder per module (ADR-0007), and the store opaque outside
`src/shell/db` (ADR-0010).

## Delivery order (vertical slices for `/speckit-tasks`)

Before step 1, in their own commits: Angelo accepts ADR-0018 and the names (R1, R2), and design
§5 catches up (R8).

1. **A card comes back worded differently** (005-US1-AS1 to AS3; INV-02 for the migrated
   store). This step brings the first migration pair, `askedQuestion` through zod, the core and
   the store, the fixtures of R8, and the store test of R5. In the skill, every question is
   rephrased and every `review grade` example carries `askedQuestion`. Run: quickstart §1.
2. **A bad rephrasing does not count** (005-US2-AS1 to AS3). This step brings `badly-rephrased`
   in `REVIEW_FLAGS` and `FLAG_POLICIES`, the second migration pair, and the skill telling a bad
   rephrasing from a badly written card. Run: quickstart §2.
3. **Close**: `CLAUDE.md` names this contract. Then the merge, `pnpm release` (Angelo),
   quickstart §3 and its Measures.

No step is a layer on its own. Step 1 carries its skill change with the CLI field it needs: the
installed CLI refuses a grade without `askedQuestion`, so the skill must send it from the same
release. Step 2 needs the first migration pair in place, because its rebuild must copy
`asked_question` (R4).

## Complexity Tracking

No violations to justify.
