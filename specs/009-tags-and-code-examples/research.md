# Research: Tags and Code Examples

Decisions marked **Angelo** were his, in the spec's Clarifications on 2026-11-16. No command,
option, output or store shape changes, so there is no public interface or schema to accept and
no ADR. No new dependency.

## R1. The example is part of the answer; the CLI is unchanged

- **Decision**: a card's example is a fenced block at the end of its `answer`, after the one to
  three lines and a blank line, its language named (` ```rust `). The skills send it through
  `aletheia card add` and `aletheia card edit` as they send any answer: JSON on a quoted
  heredoc, line breaks as `\n`. Tags keep 002's format.
- **Rationale**: `answer` is required text with no length cap (`card-add.schema.ts`), and the
  quoted heredoc already carries backticks and multi-line code untouched (001). #62tw, #k4km,
  #j3nx and #vsgy were saved that way on 2026-11-16. Quickstart §1 checks the round trip in
  `test`.
- **Alternatives**: an `example` field on the card (a migration and a contract change for text
  the answer already holds; review shows the answer whole anyway).

## R2. Each skill carries what it does itself

- **Decision**: the card rules live in `az-aletheia-add`: the tag rule, rules 2 and 8, and how an
  example is checked. Review and prune keep pointing to them ("It follows the card rules of the
  `az-aletheia-add` skill") and carry what they run themselves, each with its `sh` block:
  `aletheia tag list` for a rewrite's or replacement's tags (FR-001), `aletheia card search`
  for a rewrite or replacement (FR-006), and, in review, the profile rule (FR-004).
- **Rationale**: a skill is read alone, and the commands it shows are what `tests/skills` runs
  (slice 8, tasks decision 5). The rule prose stays in one place. Review and prune live from the
  repo; `az-aletheia-add` only after a release, so a rewrite's example follows rule 8 once the
  release lands (quickstart labels each step).
- **Alternatives**: copying the example rules into review and prune (three texts to keep in
  step); leaving the commands to add (review and prune would run commands they do not show).

## R3. Tags come from the tags in use (Angelo)

- **Decision**: before drafting, the skill runs `aletheia tag list` in that turn: once per capture, and
  for each rewrite or replacement, since an earlier one may have added a tag (constitution VIII). A card gets one tag per topic it rests on: its
  subject, the concept it builds on (`rust::ownership` for `String` vs `&str`), and the library
  it is about. A library's tag is `<language>::<ecosystem word>::<name>`: `rust::crates::anyhow`,
  `typescript::packages::zod`, `python::packages::requests`. A tag in use is reused before a new
  one is made, and a topic only mentioned in passing gets none. A tag not in the list is marked
  `(nuevo)` in the draft's header; the marker is not stored.
- **Rationale**: on 2026-11-16, eleven tags were added by hand to cards whose topics no tag named;
  the list makes a typo or a near-duplicate visible before it is saved (spec edge case).
- **Alternatives**: one ecosystem word everywhere (`rust::libs::anyhow`, renaming tags in use)
  and the library as a root tag (`anyhow`), rejected by **Angelo**; a CLI check of new tags
  (the judgment of which topic a tag names is Claude's, constitution II).

## R4. An example is checked by the exit status of its own toolchain

- **Decision**:
  - The tool is the language's compiler or runtime on the machine: `rustc` for a Rust snippet
    on `std`, `cargo` in a throwaway project for one on a crate, `node` for JavaScript and
    TypeScript (Node strips types and does not check them, so a card about a type error needs
    `tsc` at hand or says it was not checked), `python3` for Python, and the command itself for
    a read-only command (`docker ps -a` when Docker is running).
  - It runs in a folder from `mktemp -d`, outside the repo, `data/` and `~/.aletheia/` (INV-01).
  - The block stored is the code that ran, whole: a complete program (`use` lines, `fn main`), so
    it runs again as stored (SC-003). A crate it needs is named in the check line.
  - The verdict is the exit status, printed by the same call (`; echo "exit=$?"`), never the
    text the run prints: on 2026-11-16 a check printed `CHECK_DONE` whatever `cargo` answered.
  - An example meant to fail (#d6j6, E0284) passes when it fails with the error the card names.
  - A `code` card's snippet, in its question, is checked the same way: the answer gives its
    output, so a wrong output is a wrong card.
  - Fetching a library into the throwaway project through its package manager (`cargo` fetching
    `thiserror`) is the toolchain at work. The example itself never runs when it deletes, writes
    outside the folder, or calls a server.
  - The draft carries one line under its header: `✓ ejemplo comprobado: <herramienta>, exit <n>`
    (`✓ ejemplo comprobado: cargo con anyhow, exit 0`) or `⚠ ejemplo sin comprobar: <por qué>`.
    A failing example is fixed and run again; one that cannot be fixed is shown failing, never
    as checked. The line is not stored.
- **Rationale**: the exit status is a fact the machine gives (spec); the example Angelo studies
  is one that ran. The fetch line resolves the two edge cases (#vsgy needed `thiserror` through
  `cargo`).
- **Alternatives**: checking only examples with no dependency (would have left #vsgy and #j3nx
  unchecked); reading the output for a marker (the 2026-11-16 false pass).

## R5. No throwaway container for a Linux-only example

- **Decision**: an example that needs a Linux-only tool (`strace`) is shown with
  `⚠ ejemplo sin comprobar: strace no existe en macOS`. No container is started to check it, and
  `dtruss` (it needs root) is not run.
- **Rationale**: `docker run --rm` pulls an image (a server call) and writes into Docker's store,
  outside the throwaway folder: the spec's side-effect edge case bars it as written. These
  examples are rare in the deck (one card on system calls, #ve9w).
- **Alternatives**: allowing `docker run --rm` on an image already pulled. It would amend the
  edge case; Angelo can ask for it if unchecked system examples come up often.

## R6. The profile offer is for an area, a role, or how he learns (Angelo)

- **Decision**: the "Keep the profile current" sections of `az-aletheia-add` and
  `aletheia-review` offer a line only for an area's level, his role, or how he learns. A narrow
  fact inside an area (one crate, one flag, one thing he has or has not done in it) gets no
  offer («nunca he creado errores custom»), unless it changes the area's level. Then the offer
  is the area's line in general words, never naming the fact («ya domino Lambda» against
  «estudiando AWS» → «uso AWS en proyectos»).
- **Rationale**: Angelo turned down «nunca he creado tipos de error propios» and had «nunca he
  usado `thiserror`» removed: the profile says what he knows, not a list of crates.
- **Alternatives**: no offer for any narrow fact, and a line naming it («AWS: domino Lambda»),
  rejected by **Angelo**.

## R7. A rewrite or replacement is searched like a draft (Angelo)

- **Decision**: in review and prune, a rewrite or replacement that changes the question, the
  answer or the key points runs `aletheia card search` before it is shown. `words` holds the new
  question and answer lines with their terms in Spanish and English, and `tags` holds the new
  tags. The example block is left out, except names that matter (`thiserror`, `#[error]`):
  `fn`, `let` and `println` would match every Rust card. The card itself is set aside, since its
  own words bring it back. Each repeat or overlap is flagged on the before and after, or on the
  draft, as `az-aletheia-add` flags a draft (`⚠ duplica a`, `⚠ se solapa con`, archived and
  replaced cards followed). The choices are drop the change, save it anyway, or merge both (a
  replacement as in 008). A change of tags, situation or type alone runs no search.
- **Rationale**: widening #xrrj to `.map`, `.filter` and `.take_while` made it overlap #805p,
  found only at the prune that merged them into #qmzy. `card search` with a fenced block in
  `words` answers without error (checked in `test`), but the code adds noise terms.
- **Alternatives**: searching only when a rewrite widens what a card asks, and leaving overlaps
  to prune, rejected by **Angelo**.

## R8. Traced by the quickstart; no eval yet

- **Decision**: per ADR-0020, each of the 13 scenario ids is named in full in the quickstart step
  that checks it. `tests/skills/skills.test.ts` checks the skill changes: every `aletheia`
  command shown in a `sh` block runs on an empty deck, every backticked `aletheia <word>` is a
  real command, and no skill contains `pnpm aletheia`, `--env`, `ALETHEIA_DB` or `.sqlite`.
  No test file changes.
- **Rationale**: committing `quickstart.md` turns `tests/traceability` green before any skill
  changes. That is the ADR-0020 trace, not proof of the judgment: Angelo's quickstart run is.
  No eval is written: on 2026-11-16 the skills did what their text said. Asking for examples,
  adding tags by hand and turning down a narrow profile line show rules that were missing,
  which this slice adds. The second real failure of a new rule makes its eval (constitution IV).
- **Alternatives**: an eval now for the profile offer (two narrow lines in one session, both
  under a rule that allowed them).
