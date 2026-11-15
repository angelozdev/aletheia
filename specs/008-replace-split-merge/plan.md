# Implementation Plan: Replace, Split and Merge

**Branch**: `008-replace-split-merge` | **Date**: 2026-11-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/008-replace-split-merge/spec.md`

## Summary

Angelo merges two overlapping cards, splits a card with two ideas, or replaces one whose fix
changes what it asks. Claude drafts the new cards, shows them beside the old ones, and only
after his approval and his why saves them with `card add` and archives each old card with
`card archive`, the reason `reemplazada por #<id>: <why>`; each new card's source names the
old ones. No command, output or store changes (research R1, **Angelo**): the slice is text in
the prune, review and `az-aletheia-add` skills, with the skill-file tests that pin it.
Decisions are in [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 (unchanged; no source changes)

**Primary Dependencies**: none added

**Storage**: unchanged; no migration ([data-model.md](./data-model.md))

**Testing**: vitest. Skill files read as text in `tests/skills/`; every scenario `008-USx-ASy`
names its test. Three tests that pin the slice-8 deferral are restated (R5)

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skills

**Project Type**: CLI, one package; this slice changes three skills only

**Performance Goals**: none new; `card add` and `card archive` are unchanged

**Constraints**: the skills call the installed `aletheia`, never `pnpm aletheia`; the prune and
review skills need slice 7 released (`card archive` is not in the installed release today);
`az-aletheia-add` reaches Claude only through a release

**Scale/Scope**: one user. Three skill files, three test files, no source file

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.6.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Step 1 ends in a merge Angelo runs at prune; each later step adds a choice he uses in prune, review or capture. |
| II. Facts in code, judgment in Claude | Pass. Saving and archiving stay CLI facts (001, 007). Overlap, two ideas, a change of meaning and the wording are the skills'. The reason's format is a text convention Claude writes and reads; no rule computes on it. |
| III. Pure core, single writer, nothing deleted | Pass. Only the CLI writes; nothing is deleted (INV-02); every archive keeps its reason (INV-03). |
| IV. Test-driven, spec-anchored | Pass. Six scenarios, each named in a skill-file test written first. No eval before a second real failure. Three restated tests (R5) are listed below for Angelo. |
| V. Small slices, one-page specs | Pass. Three skill changes and a close, well under a day, after the command and link table were dropped (**Angelo**). |
| VI. Simplicity and YAGNI | Pass. Two existing commands composed; no new command, table or setting (R1). |
| VII. English system, Spanish content | Pass. Skill text in English; reasons, sources and skill output in Spanish (R3). |
| VIII. Conversation, not commands | Pass. The existing triggers ("podemos el mazo", "repasemos", "guarda esto") reach the new choices; the skills run `aletheia` for every fact. |
| IX. Quality over volume | Pass. Nothing is merged, split or replaced without Angelo's approval of the exact cards and his why; merge at capture keeps the overlap out. |
| Technology Constraints | Pass. Unchanged. |
| ADRs | 0002–0019 `accepted` and respected; none new. ADR-0019 foresaw the archive reason carrying the link. |

Re-check after Phase 1: unchanged. No data model change and no contract change.

## Project Structure

### Documentation (this feature)

```text
specs/008-replace-split-merge/
├── plan.md
├── research.md
├── data-model.md       # no store change; text conventions
├── quickstart.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

No `contracts/`: the CLI is unchanged, and 001's and 007's contracts stand.

### Source Code (repository root)

Only touched files are listed; slices 0 to 7 stand.

```text
.claude/skills/aletheia-prune/SKILL.md     merge for an overlap; split and replace for a leech
                                           and a situation; the add-then-archive steps
.claude/skills/aletheia-review/SKILL.md    replace or split after the grade
skills/az-aletheia-add/SKILL.md            merge at capture; follow "reemplazada por"
tests/skills/prune-skill.test.ts           008-US1-AS1, AS2, 008-US2-AS1; 007-US1-AS6 and
                                           007-US3-AS2 restated (R5)
tests/skills/review-skill.test.ts          008-US2-AS2; 004-US3-AS4 restated (R5)
tests/skills/add-skill.test.ts             008-US3-AS1, AS2
specs/004-gaps-and-rewrites/spec.md        a line: the replacement arrived with spec 008
specs/007-prune/spec.md                    the same
```

**Structure Decision**: unchanged. No source file is touched.

## Delivery order (vertical slices for `/speckit-tasks`)

Angelo chose add-then-archive over a new command and table on 2026-11-15 (R1); the design
caught up the same day (§8.4).

1. **Merge an overlap at prune** (008-US1-AS1, AS2). The prune skill gains the replacement
   steps (show the old and the drafts, approval and why, `card add`, then `card archive` per
   old card with `reemplazada por #<id>: <why>`, the failure rule of R4) and offers merge for
   an overlap; "leave them for the merge" loses its slice-8 promise. 007-US3-AS2's test is
   restated (R5). Run: quickstart §1 in `test`, §2's merge in `prod`.
2. **Split or replace, at prune and in review** (008-US2-AS1, AS2). The prune skill offers split
   and replace for a leech and replace for a situation whose fix changes meaning; the review
   skill offers them after the grade. 007-US1-AS6's and 004-US3-AS4's tests are restated (R5).
   Run: quickstart §2.
3. **Merge at capture** (008-US3-AS1, AS2). `az-aletheia-add` offers merge for an overlap with an
   active card and follows a "reemplazada por" match to the active card, without offering a
   restore; the "Replacing or merging an old card is not offered" line goes. Run: quickstart §3
   after the release.
4. **Close**: a line in specs 004 and 007 saying the deferral arrived with spec 008. Then the
   merge, `pnpm release` (Angelo, after slice 7's), quickstart §2 to §4 and the Measures.

Each step is one user-visible choice through the skill that offers it and the test that pins
it; step 1 is the thinnest, and steps 2 and 3 reuse its replacement steps.

## Complexity Tracking

| Exception | Why | Simpler option rejected |
|---|---|---|
| Restating three tests that expect `slice 8` (R5, inside steps 1 and 2) | they pinned the deferral this slice replaces | keeping "arrives with slice 8" in the skills after it ships |
