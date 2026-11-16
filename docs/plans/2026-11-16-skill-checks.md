# Skill checks that serve (ADR-0020, constitution 1.7.0)

## Context

Slice 8's implementation showed that the skill-file tests pin phrases, not behavior: three of
five tasks went red only because a phrase broke across two lines; `'merge'` passed before any
change; `'his why'` would pass with "never ask his why"; tests had to be restated each time a
wording changed (R5: three for `slice 8`, and now 007-US2-AS3 blocks T005). Meanwhile nothing
checks what can really break: the JSON examples a skill shows, which Claude copies, are never run
against the CLI.

Root cause: a skill scenario is written "Given the skill file, When it is read, Then…";
traceability demands a test per id; constitution IV forbids an eval before a second real
failure. The only test left is `toContain`. The constitution already says "Skills are reviewed
through evals, not by reading prompts"; the phrase tests contradict it.

Angelo approved (2026-11-16): keep traceability; a skill scenario is traced by the quickstart
step he runs, until its eval exists; replace phrase tests with checks code can make.

**Exception named**: this is a test-strategy refactor inside slice 8's branch, done before T005
because it removes the test that blocks it. The plan lives in
`docs/plans/2026-11-16-skill-checks.md` (this file, copied there in step 1).

## Steps (each ends green with `pnpm check`, commit after each)

### 1. The decision, recorded
- `docs/plans/2026-11-16-skill-checks.md`: this plan.
- `docs/adr/0020-skills-checked-by-what-code-can-check.md` (`accepted`, 2026-11-16) and its
  row in `docs/adr/README.md`. Decision: tests over skill files check only what code can
  check; a skill's judgment is checked by the quickstart step Angelo runs, naming the scenario
  id, and by an eval after its second real failure. Rejected: phrase tests (the evidence
  above); schemas imported directly (the CLI is the public interface).
- `.specify/memory/constitution.md` IV: an acceptance scenario's id MUST appear in the name of
  the test or eval that covers it, or, for a scenario about a skill's judgment, in the
  quickstart step that checks it until its eval exists; a test over a skill file never pins
  its wording. Version 1.7.0 (MINOR: a new rule within IV; Angelo may call it MAJOR), Last
  Amended 2026-11-16. Commit `docs: amend constitution to 1.7.0, skill scenarios traced by quickstart`.
- `CLAUDE.md` Workflow line on ids: "…carries its id in its name, or for a skill's judgment
  the quickstart step that checks it."

### 2. Traceability reads the quickstarts
- Test first, `tests/traceability/traceability.test.ts`: the fixture test "reads ids from…"
  gains `specs/999-x/quickstart.md` naming an id, expected covered; red.
- `tests/traceability/traceability.constants.ts`: `TEST_FILES` gains `'specs/*/quickstart.md'`.
  Shortcut: any id may be traced there, not only skill ones; the constitution says which
  may, review keeps it honest (upgrade to a per-id check only if a CLI scenario ever slips).

### 3. The skill checks that serve
New `tests/skills/skills.test.ts` over the four Aletheia skills
(`skills/az-aletheia-add`, `.claude/skills/aletheia-{review,prune,stats}`), table-driven:
- **Every command a skill shows is one the CLI accepts.** Each `aletheia …` line in a `sh`
  block, with its `<<'JSON'` body as stdin (indentation of list-item blocks stripped;
  placeholders `<tags>` → a tag, `<id>` → an id), runs through `cliOnTempStore`
  (`tests/support/run-cli/run-cli.ts`) on an empty deck. It passes when it exits 0 or fails
  only for the empty deck: `card "<id>" not found` (`CardNotFoundError`) or
  `no active card under …` (`NoActiveCardUnderError`). Any other error (zod, unknown option,
  unknown command) fails, naming the skill and the line. Validation runs before the store
  lookup (e.g. `card-edit.ts` `editFrom`), so a bad field is never masked.
- **Every `aletheia <group> <command>` a skill names in prose exists**: `<group> <command> --help`
  exits 0.
- **Each skill calls the installed `aletheia`** (`DEVELOPMENT_ONLY`,
  `tests/support/skills/skills.constants.ts`), its `name` matches its folder, and each trigger
  quoted after "Triggers on" in its description appears in no other skill's description.
- Extractor in `tests/support/skills/skills.ts` beside `readSkill`; types and constants in
  their files (ADR-0007). Test first: a fixture skill with a bad example (`"grade":"Good"`)
  and an unknown command is reported, as traceability tests its own fixtures.
- If a real example is rejected, that is a finding: fix the skill text and say so.

### 4. Skill ids move to the quickstarts; phrase tests go
- In each `specs/00N-*/quickstart.md` (001–008), the "In `prod`, after the release" section
  (or 008 §2–§3) names the skill scenario ids it checks, e.g. "Checks 003-US1-AS8,
  003-US2-AS5, 003-US4-AS4."; where a scenario is not exercised yet, add the bullet that
  exercises it. 27 ids: 001-US1-AS6, 001-US2-AS7; 002-US1-AS7, 002-US2-AS1, 002-US3-AS1;
  003-US1-AS8, -US2-AS5, -US4-AS4; 004-US1-AS4, -US2-AS4, -US3-AS4; 005-US1-AS3, -US2-AS3;
  006-US1-AS6, -US2-AS4, -US3-AS2; 007-US1-AS6, -US1-AS7, -US2-AS3, -US3-AS2, -US4-AS3;
  008-US1-AS1, -US1-AS2, -US2-AS1, -US2-AS2, -US3-AS1, -US3-AS2.
- Delete `tests/skills/{add,review,prune,stats}-skill.test.ts` (their structural parts live in
  step 3) and `002-US3-AS1` in `tests/skills/profile.test.ts`. Keep `002-US2-AS2` (git ignores
  `PROFILE.md`): it checks a fact.
- Traceability stays green: ids land in quickstarts before tests are deleted.

### 5. Slice 8 resumes
- `specs/008-replace-split-merge/tasks.md`: a note under Decisions that ADR-0020 replaced the
  phrase tests of T002–T007 and decisions 2–4; T005 and T008 re-cut: no phrase test; T005's
  check is the step-3 test (its new `card add`/`card archive` examples run) plus 008-US2-AS2 in
  quickstart §2. `research.md` R5/R6: superseded by ADR-0020.
- T005: `aletheia-review` offers replace or split after the grade is recorded (as tasks.md
  says), and "This skill never archives a card" becomes "never archives a card for this", the
  not-useful case.
- T008 (close, as written, plus `pnpm check` green) and T009 (hand off) as planned.

## Verification
- `pnpm check` green, traceability included, after each step.
- Step 3's check proven to bite: temporarily break one example in a skill (`"grade":"Good"`)
  and see it fail naming the skill and line; revert.
- `pnpm aletheia` quickstart 008 §1 in `test` (T008).
- After Angelo's merge and `pnpm release`: quickstart 008 §2–§3 in `prod`.
