# Implementation Plan: Capture and Review

**Branch**: `001-capture-and-review` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-capture-and-review/spec.md`

## Summary

Four commands on the `aletheia` CLI (`card add`, `card show`, `review due`, `review grade`)
over the first three domain tables, with FSRS-6 scheduling from `ts-fsrs` and dates from
`date-fns`, each behind one core module; two skills that call the installed CLI
(`az-aletheia-add`, global, and `aletheia-review`, local); and one more step in `pnpm release`
that copies the global skill next to the installed data. The technical decisions were reviewed
with Angelo one by one: [research.md](./research.md), and ADRs
[0011](../../docs/adr/0011-the-release-copies-the-global-skill.md),
[0012](../../docs/adr/0012-ts-fsrs-5-with-fsrs-6-and-one-learning-step.md) and
[0013](../../docs/adr/0013-cards-tags-and-reviews-with-rules-in-the-store.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged from slice 0)

**Primary Dependencies**: added `ts-fsrs` 5.4.2, `date-fns` 4.4.0 and `@date-fns/tz` 1.5.0,
all bundled; added `drizzle-kit` 1.0.0-rc.5, which only generates migrations (R1). Already
there: commander, zod, drizzle-orm 1.0.0-rc.5, @toon-format/toon

**Storage**: tables `cards`, `card_tags` and `reviews` in `<env>.sqlite`, with `CHECK`
constraints and INV-02 triggers; instants as UTC ISO text
([data-model.md](./data-model.md), ADR-0013)

**Testing**: vitest. Core units with a fixed clock, zone and id draws; CLI through `main()`
with a temp store in `ALETHEIA_DB` and stdin injected; skill files read as text; the skill
copy over temp folders (R12)

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skills

**Project Type**: CLI, one package, plus two Claude skills

**Performance Goals**: every call of this slice under 1 s on 1,000 cards (SC-003); the test
suite stays under 5 s (slice 0, SC-004)

**Constraints**: `src/core` pure, with clock, zone, id draws and persistence injected; only
`src/core/scheduling` imports `ts-fsrs` and only `src/core/time` imports `date-fns`; only
`src/shell/db` knows SQLite and Drizzle; instants stored in UTC and shown in local time; no
network; no test reaches `data/`, `~/.aletheia/`, `~/.claude/` or the installed `aletheia`
(INV-01)

**Scale/Scope**: one user; four commands, three tables, two skills, one release step

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.4.2, amended to 1.5.0 and 1.5.1
by this plan (R13)._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. The slice ends with Angelo capturing a card from another repo and reviewing it in `prod` (SC-001). |
| II. Facts in code, judgment in Claude | Pass. Validation, ids, scheduling, the due list and time-zone conversion are code with tests; drafting, grading by category, tags in English and answering doubts stay in the skills. |
| III. Pure core, single writer, nothing deleted | Pass. `ts-fsrs` and `date-fns` perform no I/O; repositories are ports owned by the core and implemented in `src/shell/db`; the store itself refuses deletes and review changes (INV-02). |
| IV. Test-driven, spec-anchored | Pass. Fifteen scenarios and INV-02 each name a test; no eval before a second real failure. |
| V. Small slices, one-page specs | Pass, at the limit. The spec grew with its clarifications and the slice has seven delivery steps; it is not split because Principle I needs capture and review together. |
| VI. Simplicity and YAGNI | Pass with amendment. `ts-fsrs` and `drizzle-kit` were already named; `date-fns` joins the stack at Angelo's request (see Complexity Tracking). No judge model, no numeric score (R11). |
| VII. English system, Spanish content | Pass with amendment (1.5.0): tags are now English. Skill files in English, skill output in Spanish. |
| VIII. Conversation, not commands | Pass. Both skill descriptions carry their Spanish triggers; every question about a card or what is due runs `aletheia`. |
| IX. Quality over volume | Pass for this slice: approval before saving, dispute before recording, a situation required. Quality rules and duplicates are slice 2. |
| Technology Constraints | Pass with amendment (1.5.1): `date-fns`, one importer per library, UTC stored and local time shown. |
| ADRs | 0001–0010 `accepted` and respected; 0011–0013 `proposed`, for Angelo to accept before `/speckit-implement`. |

Re-check after Phase 1: unchanged. The data model adds nothing the spec does not name except
`claude_grade` and `state_before`, both decided by Angelo and now in the spec; the contract
adds no command beyond the four.

## Project Structure

### Documentation (this feature)

```text
specs/001-capture-and-review/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

New folders only; slice 0's layout stands.

```text
src/
├── core/
│   ├── time/            only importer of date-fns: instants as stored and as shown, where today ends
│   ├── cards/           card types, the id alphabet and draw, a new card from a draft, the repository port
│   ├── scheduling/      only importer of ts-fsrs: a new card's schedule, the schedule after a grade
│   └── reviews/         the due list and its order, the review record, the repository port
└── shell/
    ├── cli/
    │   ├── main/        command groups and arguments; CliContext gains stdin, timeZone and the id draw
    │   ├── invocation/  stdin/ (read and parse JSON)
    │   └── commands/    card-add/, card-show/, review-due/, review-grade/, each with its zod schema
    ├── db/
    │   ├── schema/      Drizzle tables and their checks
    │   ├── cards/       save all or none, find by id
    │   └── reviews/     due candidates; record a review and reschedule its card in one transaction
    └── release/
        └── skill-copy/  copy beside the live folder, then swap
migrations/              one generated folder and one custom (triggers) per delivery step that adds tables
drizzle.config.ts
skills/az-aletheia-add/SKILL.md
.claude/skills/aletheia-review/SKILL.md
tests/skills/            the two skill files read as text
```

**Structure Decision**: unchanged from slice 0: one package, functional core and imperative
shell in concept folders behind `#core/*` and `#shell/*` (ADR-0004), one folder per module
(ADR-0007), the store opaque outside `src/shell/db` (ADR-0010). Lint gains two confinements,
`ts-fsrs` to `src/core/scheduling` and `date-fns` to `src/core/time`.

## Delivery order (vertical slices for `/speckit-tasks`)

Each step is one behaviour through every layer it touches and ends in something Angelo runs.
Thinnest first.

1. **Save a card and show it** (001-US1-AS1, AS4, AS5). Carries the shared setup: `drizzle-kit`,
   the schema and migration for `cards` and `card_tags`, command groups, stdin, the id draw.
   Run: `pnpm aletheia card add <<'JSON' …`, then `pnpm aletheia card show <id>`.
2. **Refuse a bad card** (001-US1-AS2, AS3, malformed JSON, INV-02 for cards). Run: the
   refusals of quickstart §1.
3. **Ask what is due** (001-US2-AS1, AS5), with `src/core/time`. Run: `pnpm aletheia review due`.
4. **Grade a card** (001-US2-AS2, AS3, AS4, AS6, AS8, INV-02 for reviews), with
   `src/core/scheduling` and the `reviews` migration. Run: quickstart §2.
5. **The two skills** (001-US1-AS6, 001-US2-AS7; FR-006 and FR-007 by use). Run:
   `pnpm test -t 001-US1-AS6`. Exception: the skills call the installed `aletheia`, so Angelo
   exercises them for real in step 7.
6. **The release copies the global skill** (001-US1-AS7, FR-009, INV-01). Run:
   `pnpm test -t 001-US1-AS7`; the real copy happens in step 7.
7. **Close**: ADRs 0011–0013 accepted, `CLAUDE.md` updated, merge, `pnpm release` (Angelo),
   the one-time link, quickstart §5 and its Measures.

No step is a layer on its own. Steps 5 and 6 are checked by tests until the release, which is
the named exception.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| `date-fns` and `@date-fns/tz` where Node 26 has `Temporal` | Angelo asked for a date library kept behind one module; Principle VI names dates among the problems to hand to a library | `Temporal` gave the same results in scratch with no dependency; `src/core/time` is the only importer, so the swap is one module |
| Rules in two places, the store and the CLI edge | SQL cannot express the tag grammar or "at least one tag", and Constitution III wants every expressible rule as a `CHECK` | CLI-only validation leaves the store open to a later command's bug |
