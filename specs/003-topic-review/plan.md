# Implementation Plan: Topic Review

**Branch**: `003-topic-review` | **Date**: 2026-11-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-topic-review/spec.md`

## Summary

Three new commands on the `aletheia` CLI (`tag list`, `review topic`, `settings show|set`) and
session options on `review due`. They rest on three new core units: `tags` (the tree and the
whole-segment topic), `sessions` (the session cap, the daily limit and the new share, placed
over slice 1's `dueList`) and `settings` (built-in defaults and how they layer). The CLI gains
one read on the review log and one table, `settings`. The review skill maps a topic to tags,
repeats the session instant, stops at the cap and saves a lasting default only with Angelo's
approval. No new dependency. Decisions in [research.md](./research.md);
[ADR-0016](../../docs/adr/0016-review-settings-in-one-row-with-a-nullable-column-each.md) is
proposed and waits for Angelo.

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged)

**Primary Dependencies**: none added. `commander` options and variadic arguments, `zod` at the
edge, `date-fns` behind `src/core/time` (gains `startOfToday`)

**Storage**: table `settings`, one generated migration (data-model.md, ADR-0016). The review
log is read through `ReviewRepository.since(instant)` and never changed

**Testing**: vitest. Core units for the tag tree, topic membership, session placement, budget
and layering, with a fixed clock. CLI tests through `main()` on temp stores, reviews arranged
by grading through the CLI or with `runSql`. Skill files read as text. Every scenario
`003-USx-ASy` names its test

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skill

**Project Type**: CLI, one package, plus the local review skill

**Performance Goals**: `tag list` and `review topic` under 1 s on 1,000 cards (SC-005); the
suite stays under 5 s

**Constraints**: `src/core` pure; only `src/shell/db` knows SQLite and Drizzle (ADR-0010);
numbers go as flags, text as JSON on stdin (spec Clarifications); no network; no test touches
`data/`, `~/.aletheia/` or the installed `aletheia` (INV-01)

**Scale/Scope**: one user; three new commands and options on one, three core units, one table,
one skill file

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.6.0._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. Step 3 ends with "repasemos mensajería" usable after a release; every later step adds a behavior Angelo meets in a review. |
| II. Facts in code, judgment in Claude | Pass. Tree, topic, order, cap, budget, share and layering are core code with tests; mapping "mensajería" to `messaging`, and telling "hoy" from "a partir de ahora", stay in the skill. |
| III. Pure core, single writer, nothing deleted | Pass. The clock and the review log come in through the context and the port; `settings` has `CHECK`s; nothing is deleted, and `default` writes `null`. |
| IV. Test-driven, spec-anchored | Pass. 23 scenarios, each named in a test; no eval before a second real failure. Three 001 tests change their expected stdout (R9), raised with Angelo before they are touched. |
| V. Small slices, one-page specs | Pass with a watch: seven steps. US4 (step 7) can move to its own slice if this one outgrows two days (spec Assumptions). |
| VI. Simplicity and YAGNI | Pass. No stored session, no tag table, no config file, no new dependency; `dueList` is reused, not copied. |
| VII. English system, Spanish content | Pass. Commands, options and docs in English; the skill talks to Angelo in Spanish. |
| VIII. Conversation, not commands | Pass. "repasemos <tema>", "hoy solo 10" and "a partir de ahora…" need no command; every question about tags, a topic or the settings runs `aletheia`. |
| IX. Quality over volume | Pass. The daily limit keeps a big capture from flooding reviews; a lasting change waits for Angelo's approval. |
| Technology Constraints | Pass. Commands that create or edit cards still take JSON; settings are not cards. |
| ADRs | 0002–0015 `accepted` and respected. 0016 `proposed`. |

Re-check after Phase 1: unchanged. The data model adds one table with `CHECK`s; the contract
adds four commands and changes `review due`'s output (R9).

## Project Structure

### Documentation (this feature)

```text
specs/003-topic-review/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

New folders and touched files only; slices 0 to 2 stand.

```text
src/
├── core/
│   ├── tags/            tag tree, topic membership, TAG_SEPARATOR (moved from similar)
│   ├── sessions/        budget, held back, re-shows, places, remaining, nextDue; over dueList
│   ├── settings/        built-in defaults, layering, SettingsRepository port
│   ├── reviews/         ReviewRepository gains since(instant); dueList unchanged
│   ├── time/            startOfToday
│   └── similar/         imports TAG_SEPARATOR from #core/tags
└── shell/
    ├── cli/
    │   ├── main/        command options and a variadic argument; groups tag and settings
    │   ├── invocation/
    │   │   └── session/       zod for the four options, the list's output
    │   └── commands/
    │       ├── tag-list/
    │       ├── review-topic/
    │       ├── review-due/     the session list, its options
    │       ├── settings-show/
    │       └── settings-set/
    └── db/
        ├── reviews/     StoreReviewRepository.since
        └── settings/    schema, StoreSettingsRepository
migrations/<ts>_settings/           generated
.claude/skills/aletheia-review/SKILL.md
tests/skills/review-skill.test.ts
```

**Structure Decision**: unchanged: one package, functional core and imperative shell in concept
folders (ADR-0004), one folder per module (ADR-0007), the store opaque outside `src/shell/db`
(ADR-0010).

## Delivery order (vertical slices for `/speckit-tasks`)

Before step 1: Angelo accepts ADR-0016 and the command names (R1), and design §5 and §9 catch
up (R10), each in its own commit.

1. **Tags in use** (003-US1-AS1): `src/core/tags` with the tree, the `tag` group and
   `tag list`. Run: `pnpm aletheia tag list`.
2. **A topic's cards** (003-US1-AS2 to AS7): topic membership, the topic list over `dueList`,
   `startOfToday`, the variadic argument and `review topic`. AS4 is a CLI test of
   `review grade` on a topic card due in 30 days. Run: quickstart §1.
3. **"repasemos mensajería"** (003-US1-AS8): the skill lists the tags, picks the ones that
   cover the topic, reviews them with `review topic`, and names the top-level tags when none
   fits. Run: `pnpm test -t 003-US1-AS8`. Exception: the skill calls the installed `aletheia`,
   so Angelo uses it for real after the release, as in slices 1 and 2.
4. **Twenty cards, then ask** (003-US2-AS1 to AS5): `ReviewRepository.since`,
   `src/core/sessions` with the cap and re-shows, command options in `main`,
   `--session` and `--session-size`, and the new output fields on `review due` and
   `review topic`. The skill repeats the session, stops at the cap, says how many remain, and
   passes "hoy solo 10". The three 001 tests of R9 get the new lines once Angelo agrees.
   Run: quickstart §2.
5. **Ten new cards a day** (003-US3-AS1 to AS4): the budget, `heldBack`, `nextDue` at
   tomorrow, `--new-per-day`. The skill mentions the held-back cards and passes
   "hoy dame 20 nuevas". Run: quickstart §3, first call.
6. **A share for new cards** (003-US3-AS5, AS6): the share places and `--new-share`, in general
   and topic reviews. Run: quickstart §3, second call.
7. **Defaults that stay** (003-US4-AS1 to AS4): the `settings` migration, `src/core/settings`,
   `settings show|set`, the lists reading the settings, and the skill telling "hoy" from
   "a partir de ahora" and saving only after approval. Run: quickstart §4.
8. **Close**: `CLAUDE.md` names the new commands and contracts, merge, `pnpm release`
   (Angelo), quickstart §5 and its Measures.

No step is a layer on its own. Step 3 is checked by its test until the release, the named
exception; steps 4 to 7 carry their skill change with the CLI behavior it relays.

## Complexity Tracking

No violations to justify.
