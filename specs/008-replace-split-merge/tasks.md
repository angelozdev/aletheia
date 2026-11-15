---

description: "Task list for 008-replace-split-merge"
---

# Tasks: Replace, Split and Merge

**Input**: Design documents from `specs/008-replace-split-merge/` (plan.md, spec.md, research.md, data-model.md, quickstart.md), constitution 1.6.0, ADRs 0002–0019

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: Mandatory (Constitution IV). Every task starts with its failing test, named by the
scenario id it covers (`008-USx-ASy`). Watch it fail, write the minimum skill text, then
refactor. This slice changes no source file: every test reads a skill file on disk through
`readSkill` (`tests/support/skills/skills.ts`), as for 004–007.

**Organization**: Phases follow the plan's delivery order (vertical slices). Each phase ends in
something Angelo runs, and each task carries the label of the story it serves.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: US1 merge at prune, US2 split or replace, US3 merge at capture
- Sub-bullets: **Test** (write first, watch it fail), **Code** (minimum to pass), **Run** (what
  Angelo can run when the task is green)

## Path Conventions

- The skills: `.claude/skills/aletheia-prune/SKILL.md`, `.claude/skills/aletheia-review/SKILL.md`
  (local, live from the repo) and `skills/az-aletheia-add/SKILL.md` (global, live only after a
  release). Skill text in English; every example the skill shows Angelo in Spanish.
- The tests: `tests/skills/prune-skill.test.ts`, `review-skill.test.ts`, `add-skill.test.ts`.
  Every skill keeps passing its `DEVELOPMENT_ONLY` check: it calls the installed `aletheia`,
  never `pnpm aletheia`.
- The text conventions of [data-model.md](./data-model.md): the old card's reason
  `reemplazada por #<id>[, #<id>…]: <why>`; the new card's source `reemplaza a #<id>[, #<id>…]`,
  after the usual source at capture (`<fuente>; reemplaza a #<id>`).

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is closed (T001).** Angelo chose `card add` then `card archive` over a new command
   and link table on 2026-11-15 (research R1); design §8.4 caught up (`7ab81b8`). No ADR and no
   contract: the CLI is unchanged.
2. **Three earlier tests are restated, not weakened (research R5).** Each expects the text
   `slice 8`, which pinned "arrives with slice 8", the deferral this slice replaces. Each drops
   `slice 8` from its list in the task that rewrites that text: `007-US3-AS2` in T002 (its
   name's "or leave for the merge" becomes "or leave"), `007-US1-AS6` in T004, `004-US3-AS4` in
   T005. The 008 test of the same task pins the new text and that `slice 8` is gone.
3. **The traceability test stays red until T007.** A task closes with every check green except
   `tests/traceability`, and its list of missing ids shrinks by exactly the ids the task names.
4. **Tests pin phrases.** Each test lists the exact phrases its skill must hold, and the code
   writes them in that wording, as in 004–007.
5. **Each skill carries the replacement steps it needs.** Prune's subsection is the full one;
   review and capture each show the two commands and the reason themselves, since a skill is
   read alone.

---

## Phase 1: Setup (gate)

- [X] T001 The gate is closed (decision 1), recorded in `specs/008-replace-split-merge/research.md`
  - Spec clarified (`087e59f`), replacement as add then archive and design §8.4 updated
    (`7ab81b8`).

---

## Phase 2: Foundational

Intentionally empty. No source, store or contract change.

---

## Phase 3: Step 1 — Merge an overlap at prune (US1) 🎯 MVP

**Goal**: at prune, Angelo merges #9p3x and #w2ab into one card, and both are archived naming it.

**Independent Test**: quickstart §1 in `test`, then §2's merge in `prod`.

- [X] T002 [US1] `aletheia-prune` gains the replacement steps and offers merge for an overlap, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Test**: `prune-skill.test.ts`, `008-US1-AS1 aletheia-prune offers merge for an overlap, and only after Angelo approves the draft and gives his why saves it through aletheia card add and archives each old card with reemplazada por`: the text holds `### Replace, split or merge`, `merge`, `without naming a technology`, `an example in each`, `aletheia card add`, `reemplaza a #`, `aletheia card archive`, `reemplazada por #`, `his why`, `only after Angelo approves`; inside the `### Replace, split or merge` subsection, `aletheia card add` comes before `aletheia card archive`. Restate `007-US3-AS2` (decision 2): drop `slice 8`, rename "or leave for the merge" to "or leave".
  - **Code**: a `### Replace, split or merge` subsection closing section 2. Show each old card's question and each draft with every field; wait until Angelo approves the exact drafts, with his edits, and ask his why in his words if he has not said it. Then one `aletheia card add` heredoc with every draft, its `source` `reemplaza a #9p3x, #w2ab`; read the ids it prints. Then one `aletheia card archive` per old card, the id without `#`, `{"card":"9p3x","reason":"reemplazada por #a7k2: se solapaban, mejor una con ambos ejemplos"}`. Say in a line that the new cards are new: the day's new-card limit applies to them, and FSRS spaces them out quickly when he grades Easy. In section 3, the overlap bullet loses "Offer no rewrite: merging two cards arrives with slice 8" and offers merge first: one draft that states the concept without naming a technology, with an example in each, following the quality rules (one idea, an answer of one to three lines); then keep both, archive one, or leave them, which records nothing and brings them back at the next prune.
  - **Run**: `pnpm test -t 008-US1-AS1`; quickstart §1.
- [X] T003 [US1] `aletheia-prune` repairs an archive that fails after the save, never saving the drafts twice, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Test**: `prune-skill.test.ts`, `008-US1-AS2 aletheia-prune, when an archive fails after the save, says which old card is still active beside the new one and archives it again, never saving the drafts a second time`: the text holds `still active beside`, `archive it again`, `a second time`.
  - **Code**: in the subsection: if `aletheia card add` exits 1, nothing was saved: read the `error:` line, fix the JSON and send it again. If an `aletheia card archive` exits 1 after the save, say which old card is still active beside the new one, fix the JSON and archive it again; never send the drafts a second time.
  - **Run**: `pnpm test -t 008-US1-AS2`

**Checkpoint**: every id of US1 has its test; "podemos el mazo" merges an overlap once slice 7 is released.

---

## Phase 4: Step 2 — Split or replace, at prune and in review (US2)

**Goal**: a leech with two ideas is split, and a card whose fix changes what it asks is
replaced, at prune and in review.

**Independent Test**: quickstart §2.

- [X] T004 [US2] `aletheia-prune` offers split and replace for a candidate, and replace for an outdated situation whose fix changes meaning, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Test**: `prune-skill.test.ts`, `008-US2-AS1 aletheia-prune offers split for a card with two ideas and replace when the fix changes what the key points mean, saved and archived as for a merge`: the text holds `**Split it**`, `two ideas`, `**Replace it**`, `changes what the key points mean`, `### Replace, split or merge`; it does not hold `slice 8`. Restate `007-US1-AS6`'s second test (decision 2): drop `slice 8`.
  - **Code**: section 2's choices gain **Split it** (the card holds two ideas: one draft per idea) and **Replace it** (the fix would change what the key points mean: one new draft), both through the subsection of T002; the line "When the fix would change what the key points mean, the card needs replacing, which arrives with slice 8" goes. In section 3, an outdated situation offers replace when the card changes meaning, an in-place edit otherwise.
  - **Run**: `pnpm test -t 008-US2-AS1`
- [ ] T005 [P] [US2] `aletheia-review` offers replace or split after the grade is recorded, in `.claude/skills/aletheia-review/SKILL.md`
  - **Test**: `review-skill.test.ts`, `008-US2-AS2 aletheia-review offers replace or split after the grade is recorded, shows the old card and the exact drafts, and saves and archives only after Angelo approves`: the text holds `after the grade is recorded`, `two ideas`, `aletheia card add`, `reemplaza a #`, `aletheia card archive`, `reemplazada por #`, `only after Angelo approves`; it does not hold `slice 8`. Restate `004-US3-AS4` (decision 2): drop `slice 8`.
  - **Code**: the lines "When the fix would change what the key points mean, the card needs replacing, which arrives with slice 8" become: after the grade is recorded, offer to replace the card (or split it when it holds two ideas): show the old card and the exact drafts, and only after Angelo approves and gives his why, run `aletheia card add` (source `reemplaza a #m4cd`) and then `aletheia card archive` (`reemplazada por #d6q1: <why>`), with the failure rule of T003. Say in a line that the new card is new: it may come up in this session if the day's new cards allow it.
  - **Run**: `pnpm test -t 008-US2-AS2`

**Checkpoint**: every id of US2 has its test; no skill says "slice 8".

---

## Phase 5: Step 3 — Merge at capture (US3)

**Goal**: a draft that overlaps an active card can be merged with it at capture, and a match
archived by a replacement leads to the card that replaced it.

**Independent Test**: quickstart §3, after the release.

- [X] T006 [P] [US3] `az-aletheia-add` offers drop, save or merge for a draft that overlaps an active card, in `skills/az-aletheia-add/SKILL.md`
  - **Test**: `add-skill.test.ts`, `008-US3-AS1 az-aletheia-add offers to drop, save or merge a draft that overlaps an active card, and merges only after Angelo approves`: the text holds `merge`, `; reemplaza a #`, `aletheia card archive`, `reemplazada por #`, `his why`, `only after Angelo approves`; it does not hold `Replacing or merging an old card is not offered`.
  - **Code**: section 2's line "Replacing or merging an old card is not offered" goes. In section 3, a draft flagged `⚠ se solapa con #<id>`, an active card, offers drop, save, or merge: one draft combining both, shown with the old question. Only after Angelo approves and gives his why, the merged draft is saved in the same `aletheia card add` as the rest, its `source` the usual one followed by `; reemplaza a #<id>`; after it answers, `aletheia card archive` the old card with `reemplazada por #<new>: <why>`, with the failure rule of T003.
  - **Run**: `pnpm test -t 008-US3-AS1`
- [ ] T007 [US3] `az-aletheia-add` follows a match archived as `reemplazada por` to the active card that replaced it, in `skills/az-aletheia-add/SKILL.md`
  - **Test**: `add-skill.test.ts`, `008-US3-AS2 az-aletheia-add follows a match archived as reemplazada por to the active card through aletheia card show and offers no restore for it`: the text holds `reemplazada por #`, `aletheia card show`, `no restore`; `007-US1-AS7`'s test stays green unchanged.
  - **Code**: in section 2's archived-match bullet: when its `archiveReason` starts with `reemplazada por #`, run `aletheia card show <id>` for each id it names; judge the draft against an active one as against any active card (`duplica a`, `se solapa con`, merge), and offer no restore for the replaced card. When none is active, follow their own reasons the same way; when the chain ends in no active card, it is an archived match as in 007.
  - **Run**: `pnpm test -t 008-US3-AS2`; `pnpm test` with the traceability test green.

**Checkpoint**: every id of the spec has its test.

---

## Phase 6: Close

- [ ] T008 Close the slice's docs, in `specs/004-gaps-and-rewrites/spec.md` and `specs/007-prune/spec.md`
  - In 004's Assumptions, the line "archive, replace, split and merge arrive with slice 7" gains "; archive arrived with spec 007, and replace, split and merge with spec 008, as `card add` then `card archive`". In 007's Assumptions, "Replace, split and merge, and a rewrite that changes what the key points mean, are slice 8" gains "; they arrived with spec 008, as `card add` then `card archive`".
  - `CLAUDE.md` is unchanged: no command or skill is added.
  - Run quickstart §1 in `test` through `pnpm aletheia`.
  - `pnpm check` is green, traceability included.
  - Commit `docs: close slice 8 tasks`.
- [ ] T009 Hand off
  - Angelo merges `008-replace-split-merge` into `main` and runs `pnpm release` from a clean `main`. Give him the commands and run neither. The release also ships slice 7, not released yet: the installed `aletheia` has no `card archive` today.
  - The release copies `az-aletheia-add` with merge at capture.
  - Then quickstart §2 and §3 in `prod`, and the Measures of quickstart §4 after two weeks (SC-002, SC-003), around 2026-11-29.

---

## Dependencies & Execution Order

- T001 is done.
- Step 1: T002 → T003 (same file).
- Step 2: T004 after T003 (same file, and it uses T002's subsection); T005 shares no file with
  T002–T004.
- Step 3: T006 → T007 (same file); T006 shares no file with T002–T005.
- T008 needs T002–T007, and T009 needs T008.

## Parallel Opportunities

- T005 (review skill) and T006 (add skill) can run beside T002–T004 (prune skill): each touches
  its own skill and test file.
- The prune tasks (T002, T003, T004) share `SKILL.md` and `prune-skill.test.ts`; run them in
  order. T006 and T007 share theirs; run them in order.

## Implementation Strategy

1. **MVP**: Phase 3 (T002–T003). After the merge and the release that ships slice 7,
   "podemos el mazo" merges an overlap in `prod`: SC-001.
2. **Then** Phase 4 (split and replace, P2) and Phase 5 (merge at capture, P3), seen in `prod`
   after the release.
3. Commit after every green task on `008-replace-split-merge`. Run `pnpm check` before closing
   each task, with the traceability exception of decision 3.
