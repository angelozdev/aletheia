# Implementation Plan: Tags and Code Examples

**Branch**: `009-tags-and-code-examples` | **Date**: 2026-11-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-tags-and-code-examples/spec.md`

## Summary

Four card rules from the 2026-11-16 review. A card gets one tag per topic it rests on, taken
from the tags in use. A card with something to run carries an example, checked by its
toolchain's exit status. The profile gets only general lines. A rewrite or replacement is
searched against the deck like a draft. No command, output or store changes (research R1): the
slice is text in `az-aletheia-add`, `aletheia-review` and `aletheia-prune`, checked by the
existing `tests/skills` and traced by the quickstart (ADR-0020). Decisions are in
[research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 (unchanged; no source changes)

**Primary Dependencies**: none added. Examples are checked with the toolchains already on the
Mac (`rustc`, `cargo`, `node`, `python3`), never added to the repo

**Storage**: unchanged; no migration ([data-model.md](./data-model.md))

**Testing**: vitest, unchanged. `tests/skills/skills.test.ts` runs every `aletheia` command a
skill shows in a `sh` block on an empty deck and checks that every backticked `aletheia <word>`
is a real command. It also checks that no skill contains `pnpm aletheia`, `--env`,
`ALETHEIA_DB` or `.sqlite`. The 13 scenario ids are traced by the quickstart steps (R8)

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skills

**Project Type**: CLI, one package; this slice changes three skills only

**Performance Goals**: none new

**Constraints**: the skills call the installed `aletheia`, never `pnpm aletheia`.
`az-aletheia-add` reaches Claude only through a release, and so do the card rules review and
prune follow from it (R2). Examples run outside the repo, `data/` and `~/.aletheia/` (INV-01)

**Scale/Scope**: one user. Three skill files and a spec line, no source or test file

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 2.0.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Each step changes what Angelo sees at capture or in review the day it lands. |
| II. Facts in code, judgment in Claude | Pass. Topics, "something to run", the example and an area's level are the skills' calls. The tags in use and an exit status are facts Claude reads from the machine. Nothing enters `src/core`. |
| III. Pure core, single writer, nothing deleted | Pass. Only the CLI writes. Examples run in a `mktemp -d` folder, never near a store (R4). |
| IV. Test-driven, spec-anchored | Pass, with a note. Committing `quickstart.md` turns `tests/traceability` green before any skill changes: that is ADR-0020's trace, not proof of the judgment; Angelo's prod run is. No source changes, so no failing test leads them. `tests/skills` checks each new `sh` block. No eval exists (`evals/` is absent), and none is written: the 2026-11-16 misses were missing rules, not a rule broken twice (R8). |
| V. Small slices, one-page specs | Pass, with a note. Four stories and 13 scenarios, but each is a paragraph of skill text in files that exist; under a day. The spec runs a little over a page, mostly Clarifications. |
| VI. Simplicity and YAGNI | Pass. No new command, field, table or setting (R1). No container to check Linux-only examples (R5). |
| VII. English system, Spanish content | Pass. Skill text in English; draft lines, flags and profile lines in Spanish. |
| VIII. Conversation, not commands | Pass. The existing triggers reach every rule; tags come from `aletheia tag list` in that turn. |
| IX. Quality over volume | See Complexity Tracking. IX names "an answer of one to three lines", and design rule 2 now puts an uncapped example block after them. |
| Technology Constraints | Pass. The CLI still performs no network call. A library fetched to check an example is fetched by its own toolchain, outside the CLI (R4). |
| ADRs | 0002–0020 `accepted` and respected; none new. ADR-0015 (profile edited only after approval) and ADR-0020 (quickstart tracing) carry this slice. |

Re-check after Phase 1: unchanged. No data model change and no contract change.

## Project Structure

### Documentation (this feature)

```text
specs/009-tags-and-code-examples/
├── plan.md
├── research.md
├── data-model.md       # no store change; text conventions
├── quickstart.md       # names all 13 scenario ids
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

No `contracts/`: the CLI is unchanged, and the contracts of 001–004 stand.

### Source Code (repository root)

Only touched files are listed; slices 0 to 8 stand.

```text
skills/az-aletheia-add/SKILL.md            `aletheia tag list` before drafting; the tag rule and
                                           `(nuevo)`; rules 2 and 8; how an example is checked
                                           and the check line; the general profile rule
.claude/skills/aletheia-review/SKILL.md    a rewrite's and a replacement's tags from
                                           `aletheia tag list`; their search before showing;
                                           the general profile rule
.claude/skills/aletheia-prune/SKILL.md     a rewrite's and a replacement's tags from
                                           `aletheia tag list`; their search before showing,
                                           each with its `sh` block
specs/002-intake-filter/spec.md            two lines: 009 puts the example outside the 1–3 lines,
                                           and words a changed area line generally
```

**Structure Decision**: unchanged. No source or test file is touched.

## Delivery order (vertical slices for `/speckit-tasks`)

1. **A tag per topic** (009-US1-AS1 to 009-US1-AS4). Add runs `aletheia tag list` before
   drafting, gives one tag per topic with the library form of R3, and marks `(nuevo)` in the
   draft's header. Review's and prune's rewrites and replacements take their tags the same way, each
   with its own `aletheia tag list`, and show each one added. Run: quickstart §1 in `test`; §2 and §4 after the release.
2. **Code examples** (009-US2-AS1 to 009-US2-AS4). Add's rule 2 keeps the block out of the
   lines, and its rule 8 asks for an example when the card has something to run. A new
   paragraph says how it is checked (R4, R5) and the line the draft carries. Review's "dame un
   ejemplo en código" rewrite follows it. Run: §3 and §4 after the release.
3. **A general profile** (009-US3-AS1 to 009-US3-AS3). Add's and review's "Keep the profile
   current" offer only an area's level, his role or how he learns, and turn a narrow fact that
   changes a level into the area's line in general words. Run: §5 in review once the review
   skill changes, no release needed; capture after the release.
4. **Searched rewrites** (009-US4-AS1, 009-US4-AS2). Review's rewrite and replacement, and
   prune's rewrite in place and replacement, run `aletheia card search` on the new fields
   before showing, set the card itself aside, and flag as add does (R7). Run: §4 in review and
   prune, no release needed for the search itself.
5. **Close**: the two lines in spec 002, `pnpm check`, the merge, `pnpm release` (Angelo),
   quickstart §2 to §5 in `prod`, and the Measures (§6) two weeks later.

Each step is one rule through every skill that applies it; step 1 is the thinnest. Steps 1 and
2 reach capture only after the release; steps 3 and 4 work in review as soon as the review
skill changes.

## Complexity Tracking

| Exception | Why | Simpler option rejected |
|---|---|---|
| An example block with no length cap, beside IX's "an answer of one to three lines" | IX holds cards to the design's quality rules, and design rule 2 (Angelo, 2026-11-16) says what the lines count: the block goes after them. A PATCH amendment would put "a code example after them does not count" in IX's wording; that is Angelo's call | capping the block (he chose "Aparte, sin tope") |
