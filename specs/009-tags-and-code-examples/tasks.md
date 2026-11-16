---

description: "Task list for 009-tags-and-code-examples"
---

# Tasks: Tags and Code Examples

**Input**: Design documents from `specs/009-tags-and-code-examples/` (plan.md, spec.md, research.md, data-model.md, quickstart.md), constitution 2.0.0, ADRs 0002–0020

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: per ADR-0020, no test pins a skill's wording. The 13 scenario ids are traced by
`quickstart.md` (`tests/traceability` is already green). Each task's **Check** is
`pnpm -s vitest run tests/skills` and `pnpm -s format:check`. The first runs every `aletheia`
command the skill shows in a `sh` block on an empty deck and checks that every backticked
`aletheia <word>` is a real command. It also checks that no skill contains `pnpm aletheia`,
`--env`, `ALETHEIA_DB` or `.sqlite`. No source or test file changes.

**Organization**: phases follow the plan's delivery order, one rule per phase through every
skill that applies it. Each phase ends in a quickstart step Angelo runs.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel with the other tasks of its phase (a different file)
- **[Story]**: US1 a tag per topic, US2 code examples, US3 a general profile, US4 searched
  rewrites
- Sub-bullets: **Code** (the skill text to write), **Check**, **Run** (what Angelo can run)

## Path Conventions

- The skills: `skills/az-aletheia-add/SKILL.md` (global, live only after a release),
  `.claude/skills/aletheia-review/SKILL.md` and `.claude/skills/aletheia-prune/SKILL.md` (local,
  live from the repo). Skill text in English; every example shown to Angelo in Spanish.
- The text conventions of [data-model.md](./data-model.md): `<tag> (nuevo)` in a draft's header,
  the check line under it, the library tag `<language>::<ecosystem word>::<name>`.
- Skill `sh` blocks: only lines that start with `aletheia ` are run by `tests/skills`; a
  `mktemp`, `rustc` or `cargo` line is shown, never run by the test.

## Decisions taken while cutting tasks (Angelo may veto)

1. **The gate is closed (T001).** Spec clarified (`7d424b3`, `5bf94d7`), plan and design
   artifacts (`aa9edfa`, `06dee55`).
2. **The rules live in `az-aletheia-add`** (research R2). Review and prune point to them and show
   the commands they run themselves: `aletheia tag list`, `aletheia card search`.
3. **Rule 8 is a shape rule.** Like rules 1–3, Claude fixes a draft that lacks its example
   before showing it; it is not a flag. It keeps design §6's number.
4. **A failing example gets its own line**: `⚠ ejemplo falla: <el error>`, beside the two of
   R4, for one that cannot be fixed (spec edge case). Added to data-model.md.
5. **An old card gets an example** when Angelo asks for one, or when a rewrite or replacement
   drafts a new answer for a card with something to run (spec edge case; FR-002 holds for every
   drafted answer). No skill offers one unprompted.
6. **Every rewrite and replacement re-tags.** 009-US1-AS4 holds for each one, whatever it
   changes: list the tags in use in that turn, give the card one tag per topic it rests on, and
   show each tag added in the before and after. A card nobody rewrites keeps its tags (spec edge
   case).
7. **A `command` or `code` card already carries its example.** A `command` card's answer is the
   command, run read-only to check it; a `code` card's snippet, in its question, is checked as
   in R4. The block of rule 8 is for the other types. The add skill's own samples follow it: the
   `docker ps` draft of section 3 gains its check line, and section 4's JSON gains a `concept`
   card with a Rust block, which `tests/skills` then sends through `card add` (R1).

---

## Phase 1: Setup (gate)

- [X] T001 The gate is closed (decision 1), recorded in `specs/009-tags-and-code-examples/research.md`
  - Spec, clarifications and plan committed; `pnpm -s vitest run tests/traceability` green.

---

## Phase 2: Foundational

Intentionally empty. No source, store or contract change.

---

## Phase 3: Step 1 — A tag per topic (US1) 🎯 MVP

**Goal**: a card's tags come from the tags in use, one per topic it rests on, with the library
under its language, and a new tag shows before it is saved.

**Independent Test**: quickstart §1 in `test`; §2, and §4's tag bullet, after the release.

- [X] T002 [US1] `az-aletheia-add` drafts tags from the tags in use, in `skills/az-aletheia-add/SKILL.md`
  - **Code**: at the start of section 1, before "Draft from the conversation": "List the tags in
    use first, in that turn:", a `sh` block with `aletheia tag list`, and "It prints each tag
    with its ancestors and how many active cards it covers." In "The fields", the `tags` bullet
    gains, after its format sentence: one tag for each topic the card rests on: its subject, the
    concept it builds on (`rust::ownership` for a card on `String` vs `&str`), and the library
    it is about, under its language with its ecosystem's word for a library
    (`rust::crates::anyhow`, `typescript::packages::zod`, `python::packages::requests`). Reuse a
    tag in use before making one. A topic the card only mentions gets none. In section 3, add
    after the existing sample: a tag the list did not print is marked `(nuevo)` in the header,
    so a typo or a near-duplicate shows before it is saved; send it without the mark. Add a
    second sample header: `2. concept · rust::error-handling, rust::crates::anyhow (nuevo)`.
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §1; §2 after the release (009-US1-AS1, 009-US1-AS2, 009-US1-AS3).
- [X] T003 [P] [US1] `aletheia-review` tags a rewrite and a replacement from the tags in use, in `.claude/skills/aletheia-review/SKILL.md`
  - **Code**: in "### A rewrite", after "It follows the card rules of the `az-aletheia-add`
    skill.": every rewrite lists the tags in use in that turn (decision 6), a `sh` block with
    `aletheia tag list`, and gives the card one tag for each topic it rests on, by those rules,
    adding any it lacks. Add a before and after sample for tags:
    `#9p3x · tags` / `antes:   messaging` /
    `después: messaging, messaging::rabbitmq (nuevo)`. In "### A replacement",
    after "Draft the new cards by the card rules of the `az-aletheia-add` skill": their tags are
    listed the same way, in that turn.
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §4, after the release (009-US1-AS4).
- [X] T004 [P] [US1] `aletheia-prune` tags a rewrite and a replacement from the tags in use, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Code**: in the "**Rewrite it in place**" choice, after its first sentence: every
    rewrite runs `aletheia tag list` in that turn (decision 6) and tags the card by the card
    rules of the `az-aletheia-add` skill, adding any tag it lacks, a tag not in use marked
    `(nuevo)` in the before and after.
    In "### Replace, split or merge", after "The new cards follow the card rules of the
    `az-aletheia-add` skill.": their tags come from `aletheia tag list`, run in that turn.
    Section 2 already shows `aletheia tag list` in a `sh` block; no new block.
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §4, after the release (009-US1-AS4).

**Checkpoint**: every skill that drafts tags lists the tags in use in that turn.

---

## Phase 4: Step 2 — Code examples (US2)

**Goal**: a card with something to run carries an example after its lines, checked by its
toolchain's exit status, and the draft says whether it was checked.

**Independent Test**: quickstart §3 and §4's example bullet, after the release.

- [X] T005 [US2] `az-aletheia-add` gains rules 2 and 8 and how an example is checked, in `skills/az-aletheia-add/SKILL.md`
  - **Code**:
    - Rule 2 becomes: "**An answer of one to three lines.** Longer means it is not one idea
      yet. An example goes after them, in its own code block, and does not count toward them,
      whatever its length."
    - After rule 7: "8. **An example when the card has something to run**: code, a command or
      a short program that shows its idea, in a language card or a system one (`strace` for a
      system call). A comparison, or a concept nothing runnable shows, gets none."
    - "Rules 1–3 are about shape" becomes "Rules 1–3 and 8 are about shape" (decision 3).
    - A `### The example` subsection after "The fields", from research R4 and R5:
      - The example goes at the end of `answer`: its lines, a blank line, then a fenced block
        naming its language. The block is the code that ran, whole: a complete program, with
        its `use` lines and `fn main`, so it runs again as stored.
      - Check it before showing the draft, in a folder from `mktemp -d`, never in the repo,
        `data/` or `~/.aletheia/`. Use `rustc` for a Rust snippet on `std`, and `cargo` in a
        throwaway project for one on a crate. Use `node` for JavaScript and TypeScript: Node
        strips types and does not check them, so a card on a type error needs `tsc` at hand.
        Use `python3` for Python, and the command itself for a read-only one (`docker ps -a`
        with Docker running).
      - A `sh` sample: `dir=$(mktemp -d)`, a quoted heredoc writing `"$dir/main.rs"`, then
        `rustc --edition 2024 "$dir/main.rs" -o "$dir/main" && "$dir/main"; echo "exit=$?"`.
      - The verdict is the exit status the same call prints, never the text the run prints.
        An example meant to fail (`"42".parse()` with no type) passes when it fails with the
        error the card names (E0284). A `code` card's snippet, in its question, is checked
        the same way.
      - Fetching a crate or package into the throwaway project through its package manager is
        the toolchain at work. Never run an example that deletes, writes outside the folder,
        calls a server or needs root.
      - A Linux-only tool missing on the Mac (`strace`) leaves the example unchecked: start no
        container for it.
      - A failing example is fixed and run again. One that cannot be fixed is shown failing,
        never as checked.
    - In section 3, a draft with an example carries one line under its header, before any
      flag: `✓ ejemplo comprobado: <herramienta>, exit <n>` (`✓ ejemplo comprobado: cargo con
      anyhow, exit 0`), `⚠ ejemplo sin comprobar: <por qué>`
      (`⚠ ejemplo sin comprobar: strace no existe en macOS`), or `⚠ ejemplo falla: <el error>`
      (decision 4). The line is not stored.
    - Samples (decision 7): rule 8 says a `command` card's answer and a `code` card's snippet
      are their example. The `docker ps` draft of section 3 gains
      `✓ ejemplo comprobado: docker ps -a, exit 0` under its header, before its flag. Section
      4's JSON gains a second card, compiled with `rustc --edition 2024` (exit 0), so its
      `ids[2]: k7m2,p3x9` line holds:

      ```json
      {"type":"concept","question":"En Rust, ¿qué te da implementar `From<A> for B`?","answer":"Convierte un `A` en un `B` con `B::from(a)`, y gratis `a.into()` donde se espera un `B`.\n\n```rust\nstruct Celsius(f64);\n\nimpl From<f64> for Celsius {\n    fn from(grados: f64) -> Self {\n        Celsius(grados)\n    }\n}\n\nfn main() {\n    let c: Celsius = 21.5.into();\n    println!(\"{}\", c.0);\n}\n```","keyPoints":["`B::from(a)` convierte `A` en `B`","`.into()` viene gratis"],"situation":"Una función recibe `Celsius` y quieres pasarle un `f64` sin envolverlo a mano.","tags":["rust::traits"],"source":"aletheia"}
      ```
  - **Check**: `pnpm -s vitest run tests/skills` (it sends the new card through `card add`);
    `pnpm -s format:check`.
  - **Run**: quickstart §3, after the release (009-US2-AS1, 009-US2-AS2, 009-US2-AS3,
    009-US2-AS4).
- [X] T006 [P] [US2] `aletheia-review` adds an example through a rewrite, in `.claude/skills/aletheia-review/SKILL.md`
  - **Code**: in "### A rewrite", after the tags paragraph of T003: when Angelo asks for an
    example ("dame un ejemplo en código"), or the rewrite drafts a new answer for a card with
    something to run, the answer gets one by rule 8 and "The example" of the `az-aletheia-add`
    skill. It is checked before the before and after is shown, and its check line goes under
    the `answer` field's header. Otherwise an old card keeps its answer (decision 5). In "### A
    replacement": its drafts follow the same rule.
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §4, after the release (009-US2-AS1, 009-US2-AS2).

**Checkpoint**: a draft or a rewrite with something to run shows its example and its check
line.

---

## Phase 5: Step 3 — A general profile (US3)

**Goal**: the profile offer is for an area's level, a role or how he learns; a narrow fact gets
none, unless it changes the area's level.

**Independent Test**: quickstart §5 in review, no release needed; capture after the release.

- [X] T007 [US3] `az-aletheia-add` offers only general profile lines, in `skills/az-aletheia-add/SKILL.md`
  - **Code**: in "## Keep the profile current", after "Only explicit statements count: never a
    grade, a streak of Easy, or your guess.": offer a line only for an area's level, his role,
    or how he learns. A narrow fact inside an area gets no offer: one crate, one flag, one
    thing he has or has not done in it («nunca he creado errores custom» under Rust). The
    exception is a narrow fact that changes the area's level: then offer the area's new line in
    general words, never naming the fact ("ya domino Lambda" against "estudiando AWS" →
    `¿Cambio en tu perfil «estudiando AWS» por «uso AWS en proyectos»?`). In the second offer
    bullet, the example ("ya domino Lambda" against "estudiando AWS") becomes ("ya uso Docker a
    diario" against "Docker: aprendiendo").
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §5's last bullet, at a capture after the release (009-US3-AS1,
    009-US3-AS2, 009-US3-AS3).
- [X] T008 [P] [US3] `aletheia-review` offers only general profile lines, in `.claude/skills/aletheia-review/SKILL.md`
  - **Code**: the same paragraph and bullet change as T007, in its "## Keep the profile
    current".
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §5 (009-US3-AS1, 009-US3-AS2, 009-US3-AS3).

**Checkpoint**: neither skill offers a line for a narrow fact that leaves a level as it is.

---

## Phase 6: Step 4 — Searched rewrites (US4)

**Goal**: a rewrite or replacement that changes the question, the answer or the key points is
searched against the deck before it is shown, so an overlap is decided before it is saved.

**Independent Test**: quickstart §4's search bullets, no release needed.

- [X] T009 [US4] `aletheia-review` searches a rewrite and a replacement before showing them, in `.claude/skills/aletheia-review/SKILL.md`
  - **Code**: in "### A rewrite", before "Show the exact before and after": when the rewrite
    changes the question, the answer or the key points, search the deck first, in that turn,
    with a `sh` block:
    `aletheia card search <<'JSON'` /
    `{"words":"En una cola clásica de RabbitMQ, ¿qué pasa con un mensaje después de que el consumidor lo confirma con ack? ack confirmación acknowledge borrado","tags":["messaging::rabbitmq"]}` /
    `JSON`. Then, from research R7:
    - `words` holds the new question and answer lines with their terms in Spanish and English.
      The example block stays out, except names that matter (`thiserror`, `#[error]`).
      `tags` holds the new tags.
    - Set the card itself aside: its own words bring it back.
    - Judge each listed card as the `az-aletheia-add` skill judges a draft's matches (its
      section 2, archived and replaced cards included). Flag a repeat or an overlap on the line
      after the before and after's header (`⚠ se solapa con #w2ab: …`).
    - A flagged rewrite offers three choices: drop it, save it anyway, or merge both through
      "### A replacement".
    - A change of tags, situation or type alone runs no search.

    In "### A replacement": its drafts are searched the same way before they are shown, the
    old card set aside.
  - **Check**: `pnpm -s vitest run tests/skills` (it runs the new `card search` block);
    `pnpm -s format:check`.
  - **Run**: quickstart §4 (009-US4-AS1, 009-US4-AS2).
- [X] T010 [P] [US4] `aletheia-prune` searches a rewrite in place and a replacement before showing them, in `.claude/skills/aletheia-prune/SKILL.md`
  - **Code**: in the "**Rewrite it in place**" choice, before its `aletheia card edit` block:
    when it changes the question, the answer or the key points, search the deck first, in that
    turn, as the `aletheia-review` skill does for a rewrite. Show a `sh` block:
    `aletheia card search <<'JSON'` /
    `{"words":"En Redis Streams, ¿cómo reparte un consumer group los mensajes de un stream entre sus consumidores? consumer group XREADGROUP reparto","tags":["messaging::redis-streams"]}` /
    `JSON`. Set the card itself aside, flag a repeat or overlap on the before and after, and
    offer drop, save, or merge. In "### Replace, split or merge", before "Show each old
    card's question and each draft": each draft is searched the same way, the old cards set
    aside, and a flag offers dropping the draft, saving it, or merging it with the card it
    overlaps.
  - **Check**: `pnpm -s vitest run tests/skills`; `pnpm -s format:check`.
  - **Run**: quickstart §4, at "podemos el mazo" (009-US4-AS1).

**Checkpoint**: no rewrite or replacement of question, answer or key points is shown unsearched.

---

## Phase 7: Close

- [ ] T011 Close the slice's docs, in `specs/002-intake-filter/spec.md`
  - In 002's edge cases, the shape-rule line ("an answer of 1–3 lines") gains "; spec 009 puts
    a code example after those lines, outside them". The Lambda line gains "; spec 009 words
    the changed line generally («uso AWS en proyectos»), never naming the narrow fact".
  - `CLAUDE.md` is unchanged: no command or skill is added.
  - Run quickstart §1 in `test` through `pnpm aletheia`.
  - `pnpm check` is green, traceability included.
  - Commit `docs: close slice 9 tasks`.
- [ ] T012 Hand off
  - Angelo merges `009-tags-and-code-examples` into `main` and runs `pnpm release` from a clean
    `main`. Give him the commands and run neither. The release ships `az-aletheia-add` with the
    tag, example and profile rules.
  - Save a memory: mark T012 in `specs/009-tags-and-code-examples/tasks.md` after the prod
    quickstart §2–§5 and the two-week Measures (§6), on a feature branch.
  - Then quickstart §2 to §5 in `prod`, and the Measures of §6 two weeks after the release
    (SC-001 to SC-005).

---

## Dependencies & Execution Order

- T001 is done.
- Same-file chains, in order: add T002 → T005 → T007; review T003 → T006 → T008 → T009;
  prune T004 → T010.
- Across files, each phase's tasks are independent: within a phase, the review and prune tasks
  (marked [P]) can run beside the add task.
- T011 needs T002–T010, and T012 needs T011.

## Parallel Opportunities

- Phase 3: T003 and T004 beside T002. Phase 4: T006 beside T005. Phase 5: T008 beside T007.
  Phase 6: T010 beside T009.
- Implementers on the same skill file never run at once.

## Implementation Strategy

1. **MVP**: Phase 3 (T002–T004). After the merge and the release, a capture lists the tags in
   use and tags the crate: SC-002.
2. **Then** Phase 4 (examples, P2), Phase 5 (profile, P3) and Phase 6 (searched rewrites, P4).
   Phases 5 and 6 work in review as soon as the review skill changes; Phase 4 at capture after
   the release.
3. Commit after every green task on `009-tags-and-code-examples`. Run `pnpm check` before
   closing each task.
