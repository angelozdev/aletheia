# Implementation Plan: Gaps and Rewrites

**Branch**: `004-gaps-and-rewrites` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-gaps-and-rewrites/spec.md`

## Summary

`review grade` takes an optional `flag` (`missing-prerequisite` or `badly-written`) and an
optional `prerequisiteOf`; a new command, `card edit`, changes a card's content in place. The
core gains a voided review (recorded, schedules nothing), three counting rules in
`src/core/sessions` (a card voided today leaves the lists, a pulled prerequisite counts toward
neither cap, a voided review introduces no card) and `editCard`. The store gains two nullable
columns on `reviews` and an update trigger on the search index. The review skill tells a gap
from bad wording, pulls or offers the prerequisite, voids, and rewrites only with Angelo's
approval. No new dependency. Decisions in [research.md](./research.md);
[ADR-0017](../../docs/adr/0017-a-review-carries-one-flag-and-the-card-it-was-a-prerequisite-of.md)
is accepted.

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged)

**Primary Dependencies**: none added. `zod` at the edge, `ts-fsrs` behind `src/core/scheduling`
(unchanged)

**Storage**: `reviews` gains `flag` and `prerequisite_of` through a generated migration that
rebuilds the table, followed by a custom one restoring its two triggers (R2, ADR-0017); a
custom migration adds `card_search_on_update` (R7). No new table

**Testing**: vitest. Core units for the voided grade, the three counting rules and `editCard`,
with a fixed clock. CLI tests through `main()` on temp stores. Store tests for the new
`CHECK`s and for the triggers surviving the rebuild, through `tests/support/store`. Skill files
read as text. Every scenario `004-USx-ASy` names its test

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skill

**Project Type**: CLI, one package, plus the local review skill

**Performance Goals**: none new; `card edit` touches one card. The suite stays under 5 s

**Constraints**: `src/core` pure; only `src/shell/db` knows SQLite and Drizzle (ADR-0010);
free text as JSON on stdin; no network; no test touches `data/`, `~/.aletheia/` or the
installed `aletheia` (INV-01)

**Scale/Scope**: one user; one new command, two fields on another, three migrations, one
skill file

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.6.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Step 2 ends with "no recuerdo qué es X" working through the skill after a release; every step adds a behavior Angelo meets in a review. |
| II. Facts in code, judgment in Claude | Pass. Voiding, the counting rules and the edit are core code with tests; telling a gap from bad wording, judging whether a card covers the concept and drafting a rewrite stay in the skill. |
| III. Pure core, single writer, nothing deleted | Pass. The clock and the stores come in through the ports; `CHECK`s refuse every contradiction; no card or review is deleted, and the review triggers are restored after the rebuild (R2). An edit replaces a card's tag rows, not the card. |
| IV. Test-driven, spec-anchored | Pass. 12 scenarios, each named in a test; no eval before a second real failure. Two review fixtures gain `null` fields (R10), with no assertion changed. |
| V. Small slices, one-page specs | Pass. Four steps; US3 stands alone and can move if the slice outgrows two days. |
| VI. Simplicity and YAGNI | Pass. One `flag` column, no voided column, no edit history, no archived-card check before archive exists (R8). |
| VII. English system, Spanish content | Pass. Commands, fields and docs in English; card content and the skill's words to Angelo in Spanish. |
| VIII. Conversation, not commands | Pass. "no recuerdo qué es X" and "la pregunta está mal" need no command; every question about a card runs `aletheia`. |
| IX. Quality over volume | Pass. A gap feeds the deck only through `az-aletheia-add`'s approval; a rewrite is saved only after Angelo approves the exact text. |
| Technology Constraints | Pass. `card edit` takes JSON validated with `zod`; the custom migrations hold only triggers, which Drizzle cannot express. |
| ADRs | 0002–0016 `accepted` and respected; 0014's update trigger arrives as it foresaw. 0017 `accepted`. |

Re-check after Phase 1: unchanged. The data model adds two columns with `CHECK`s and two
triggers' worth of custom SQL; the contract adds one command and two optional fields, and
changes no existing output.

## Project Structure

### Documentation (this feature)

```text
specs/004-gaps-and-rewrites/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

New folders and touched files only; slices 0 to 3 stand.

```text
src/
├── core/
│   ├── reviews/         REVIEW_FLAGS, ReviewFlag; Review gains flag, prerequisiteOf; gradeCard voids
│   ├── sessions/        voided today, counted toward the cap, introduced today
│   └── cards/           editCard, CardEdit; CardRepository gains update(card)
└── shell/
    ├── cli/
    │   ├── main/        registers card edit
    │   └── commands/
    │       ├── review-grade/   flag, prerequisiteOf, cross-field rules
    │       ├── card-add/       field schemas shared with card edit
    │       └── card-edit/
    └── db/
        ├── reviews/     schema columns and CHECKs; record and since carry the new fields
        └── cards/       StoreCardRepository.update
migrations/<ts>_review_flags/                 generated
migrations/<ts>_reviews_never_change_again/   custom
migrations/<ts>_card_search_on_update/        custom
.claude/skills/aletheia-review/SKILL.md
tests/skills/review-skill.test.ts
```

**Structure Decision**: unchanged: one package, functional core and imperative shell in concept
folders (ADR-0004), one folder per module (ADR-0007), the store opaque outside `src/shell/db`
(ADR-0010).

## Delivery order (vertical slices for `/speckit-tasks`)

Before step 1, done: Angelo accepted ADR-0017 and the names (R1), and design §5 caught up (R10), each
in its own commit.

1. **A gap is logged** (004-US1-AS1; AS2 for the flag rules): the two migrations of R2,
   `flag` on `Review` and `review grade`, its zod rules and `CHECK`s, the two review fixtures.
   Run: `pnpm aletheia review grade` with `"flag":"missing-prerequisite"`, then the same with
   `"grade":"hard"`.
2. **The prerequisite asked next** (004-US1-AS2 for `prerequisiteOf`, AS3, AS4):
   `prerequisiteOf` through the CLI, core and store; "counted toward the cap" and "introduced
   today" skipping prerequisite reviews; the skill's section on a missing base concept. Run:
   quickstart §1.
3. **A badly written review does not count** (004-US2-AS1 to AS4): the voided grade, the card
   left out until tomorrow with its `nextDue`, the voided review counting toward the cap and
   not toward the day; the skill voiding a review whose wording decided it, right or wrong.
   Run: quickstart §2.
4. **Rewrite in place** (004-US3-AS1 to AS4): `CardRepository.update`, `card_search_on_update`,
   `editCard` and `card edit`; the skill proposing a rewrite after a voided review or on
   request, and saving it only after approval. Run: quickstart §3.
5. **Close**: `CLAUDE.md` names `card edit`, the new fields and this contract; merge,
   `pnpm release` (Angelo), quickstart §4 and its Measures.

No step is a layer on its own. Steps 2 to 4 carry their skill change with the CLI behavior it
relays; the skill calls the installed `aletheia`, so Angelo uses it for real after the release,
as in slices 1 to 3.

## Complexity Tracking

No violations to justify.
