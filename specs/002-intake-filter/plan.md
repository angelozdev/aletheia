# Implementation Plan: Intake Filter

**Branch**: `002-intake-filter` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-intake-filter/spec.md`

## Summary

One command on the `aletheia` CLI, `card search`, over a new FTS5 table filled by a trigger, with
the search terms, the tag family and the order built in a new core module; an untracked
`PROFILE.md` at the repo root; and two skills that use them: `az-aletheia-add` searches every
draft and flags duplicates and junk, and both skills offer profile changes the moment Angelo
states his level. No new dependency. Decisions in [research.md](./research.md), ADRs
[0014](../../docs/adr/0014-card-search-with-fts5-and-terms-built-in-the-core.md) and
[0015](../../docs/adr/0015-the-profile-is-an-untracked-file-read-in-place.md), both `proposed`.

## Technical Context

**Language/Version**: TypeScript 7.0.2 on Node 26 with native type stripping; the release is a
Rolldown bundle (unchanged)

**Primary Dependencies**: none added. FTS5 ships with the SQLite in `node:sqlite` (3.54.0,
checked in scratch with `unicode61` and `trigram`)

**Storage**: virtual table `card_search` and trigger `card_search_on_insert` in a custom
migration, backfilled from `cards` ([data-model.md](./data-model.md), ADR-0014).
`PROFILE.md` at the repo root, outside the store and outside git (ADR-0015)

**Testing**: vitest. Core units for terms, tag family and order; CLI through `main()` with a
temp store and stdin (`runOnStore`); 002-US1-AS6 over a store migrated without, then with, the
search migration (`migrationsDir`); skill files read as text; `git check-ignore` for the profile

**Target Platform**: macOS, Node 26, pnpm 11.28.8, Claude Code for the skills

**Project Type**: CLI, one package, plus two Claude skills

**Performance Goals**: `card search` under 1 s on 1,000 cards (SC-004); the suite stays under 5 s

**Constraints**: `src/core` pure; only `src/shell/db` knows SQLite, FTS5 and Drizzle
(ADR-0010); search text never reaches FTS5 syntax (FR-003); no network; no test reads or writes
`~/me/aletheia/PROFILE.md`, `data/`, `~/.aletheia/` or the installed `aletheia` (INV-01)

**Scale/Scope**: one user; one command, one virtual table and trigger, one core module, two
skill files, one ignored file

## Constitution Check

_Gate before Phase 0, re-checked after Phase 1. Constitution 1.5.1, to be amended to 1.6.0
before `/speckit-implement` (R7)._

| Principle | Status |
|---|---|
| I. Daily use over infrastructure | Pass. The slice ends with flags seen in `prod` from another repo (SC-001) and a profile kept current during reviews. |
| II. Facts in code, judgment in Claude | Pass. Terms, common words, tag family, order and limit are core code with tests; duplicates, overlaps, trivia, level and profile wording stay in the skills and the profile. |
| III. Pure core, single writer, nothing deleted | Pass. The core receives matches through the port; FTS5 lives in the adapter and the migration; the trigger only inserts. `PROFILE.md` is not data in the store, and Claude edits it only after approval. |
| IV. Test-driven, spec-anchored | Pass with amendment (1.6.0): evals freeze the profile they were written with. Ten scenarios each name a test; no eval before a second real failure. |
| V. Small slices, one-page specs | Pass. Three stories, six delivery steps; the code is one command, the rest is skill text. |
| VI. Simplicity and YAGNI | Pass with a justification: the common-word list is hand-picked (see Complexity Tracking). No vectors, no stemmer, no new dependency. |
| VII. English system, Spanish content | Pass. Code, skills and docs in English; profile, flags and offers in Spanish. |
| VIII. Conversation, not commands | Pass. No new trigger to remember; every question about existing cards runs `aletheia card search` or `card show`. |
| IX. Quality over volume | Pass. This slice is the entry filter: every worth rule is flagged, and Angelo still decides. |
| Technology Constraints | Pass with amendment (1.6.0): `PROFILE.md` is untracked, and the global skill reads it from the repo. |
| ADRs | 0001–0013 `accepted` and respected; 0011 extended by 0015. 0014 and 0015 `proposed`, for Angelo to accept before `/speckit-implement`. |

Re-check after Phase 1: unchanged. The data model adds only the search table, its trigger and
the profile file; the contract adds one command.

## Project Structure

### Documentation (this feature)

```text
specs/002-intake-filter/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/cli.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

New folders and touched files only; slices 0 and 1 stand.

```text
src/
├── core/
│   ├── similar/         search terms, common words, tag family, the order and its limit; similarCards()
│   └── cards/           CardRepository gains matching(terms)
└── shell/
    ├── cli/
    │   ├── main/        registers card search
    │   └── commands/
    │       └── card-search/   zod schema (reuses the tag grammar of card-add), the command
    └── db/
        └── cards/       StoreCardRepository.matching: the FTS5 query, active cards only
migrations/<ts>_card_search/   custom: virtual table, insert trigger, backfill
skills/az-aletheia-add/SKILL.md          searches, flags, profile read and offers
.claude/skills/aletheia-review/SKILL.md  profile offers
.gitignore                               /PROFILE.md
PROFILE.md                               ignored; written in step 4, approved by Angelo
tests/skills/            the two skill files read as text; the profile ignored by git
```

**Structure Decision**: unchanged: one package, functional core and imperative shell in concept
folders (ADR-0004), one folder per module (ADR-0007), the store opaque outside `src/shell/db`
(ADR-0010).

## Delivery order (vertical slices for `/speckit-tasks`)

Before step 1: Angelo accepts ADRs 0014 and 0015, and R7 is applied (constitution 1.6.0, design
§5, §8.1, §9), each in its own commit.

1. **Search by words** (002-US1-AS2, AS3, AS4, AS5 without tags, AS6). Carries the migration,
   `src/core/similar` with terms and common words, the port method and its adapter, and the
   command. Run: `pnpm aletheia card search <<'JSON' { "words": "contenedor" } JSON`.
2. **Tags join the search** (002-US1-AS1, AS5 with a malformed tag): the tag family and the
   three-group order. Run: quickstart §1.
3. **Capture flags duplicates** (002-US1-AS7; FR-005 and FR-007 by use): `az-aletheia-add`
   searches every draft with synonyms and technical terms and flags `duplica a` and
   `se solapa con`. Run: `pnpm test -t 002-US1-AS7`. Exception: the skill calls the installed
   `aletheia`, so Angelo exercises it for real in step 6.
4. **The profile flags junk** (002-US2-AS1, AS2): `/PROFILE.md` in `.gitignore`, the first
   profile written with Angelo, the add skill reads it and flags `trivia`,
   `ya lo sabes por tu perfil` and `sin situación creíble`. Run: `git check-ignore PROFILE.md`
   and `pnpm test -t 002-US2`.
5. **The profile kept current** (002-US3-AS1, FR-006): both skills offer the change the moment
   Angelo states his level. Run: a review in this repo, whose skill loads from the working tree
   (quickstart §4, first half).
6. **Close**: ADRs 0014–0015 accepted, `CLAUDE.md` names `card search` and the profile, merge,
   `pnpm release` (Angelo), quickstart §2 to §4 and its Measures.

No step is a layer on its own. Step 3 is checked by its test until the release, the named
exception, as in slice 1.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| A hand-picked list of common words where Principle VI prefers a library | 002-US1-AS1 needs a card sharing only `qué` or `hay` left out, and the list includes the words that frame card questions | `stopword` 3.1.5 lacks `es`, `hay`, `entre`, `cómo`; `stopwords-iso` has had no release since 2022 (R3) |
| The global skill reads a file from the repo, outside the release (ADR-0011) | Angelo wants a profile change to count at once, from any repo | Copying it with the release makes every change wait for a merge and a release (ADR-0015) |
