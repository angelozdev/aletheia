# Research: Replace, Split and Merge

Decisions marked **Angelo** were his, in the spec's Clarifications or in planning on
2026-11-15. No command, option, output or store shape changes, so there is no public
interface or schema to accept and no ADR. No new dependency.

## R1. A replacement is `card add`, then `card archive` (Angelo)

- **Decision**: the skills save the new cards with `aletheia card add` (001), which prints
  their ids, and then archive each old card with `aletheia card archive` (007), its reason
  naming the new ids and giving Angelo's why. Merge (many to one), split (one to many) and
  replace (one to one) are the same two calls.
- **Rationale**: both commands exist, are tested, and already refuse what must be refused: an
  invalid draft (001), a blank reason, a card that does not exist or is archived (007-US1-AS2).
  ADR-0019 foresaw it: "slice 8 can record 'replaced by #id' as an archive reason with no
  migration". The slice becomes skill text and its tests.
- **Alternatives**: a `card replace` command that saves and archives in one transaction and
  writes a `card_replacements(card_id, replaced_id)` link table (append-only, a new INV), so
  the session could hide a replacement until the next day and exempt it from new-per-day, and
  `card show` could list what a card replaces. Rejected by Angelo as more than the slice needs:
  the two rules it served were Claude's calls in design §8.4, and both are dropped. A JSON
  `cards.replaces` column (no foreign key, a trigger on a row `card edit` updates) and parsing
  the link out of the archive reason (a business rule over prose) were weighed with it.

## R2. Add first, archive after

- **Decision**: `card add` runs first; each `card archive` runs only after it answered.
- **Rationale**: the archive reason names ids that exist only once `card add` prints them. If
  an archive then fails, the deck has an old card active beside its replacement: visible, and
  fixed by archiving it again. The other order could leave an old card archived "reemplazada
  por" a card that was never saved.
- **Alternatives**: archive first (a reason naming nothing); one command doing both (R1).

## R3. The link is text, in Spanish

- **Decision**: the old card's archive reason is `reemplazada por #<id>[, #<id>…]: <why>`, his
  why in his words. Each new card's source names the old ones: `reemplaza a #9p3x, #w2ab`,
  after the usual source at capture (`<fuente>; reemplaza a #9p3x`).
- **Rationale**: archive reasons and sources are card content, in Spanish (constitution VII).
  Claude reads the link: `az-aletheia-add` follows a "reemplazada por" match to the active card
  (FR-002) with `aletheia card show <id>`; no command parses it.
- **Alternatives**: English ("replaced by #id", design §8.4's wording, which predates
  constitution VII's reading of archive reasons as content); the link only on one side.

## R4. Failure handling stays the commands'

- **Decision**: `card add` is all or none: if it exits 1, nothing was saved; Claude fixes the
  JSON and sends it again. If an archive exits 1 after the save, Claude says which old card is
  still active beside the new one and archives it again; it never sends the drafts a second
  time (008-US1-AS2).
- **Rationale**: the only partial state two calls can leave is one more active card, and the
  skill can repair it with the second call alone.

## R5. Three tests that pin the slice-8 deferral are restated

- **Decision**: `tests/skills/prune-skill.test.ts` (007-US1-AS6, 007-US3-AS2) and
  `tests/skills/review-skill.test.ts` (004-US3-AS4) expect the text `slice 8`, which pinned
  "arrives with slice 8". This slice replaces that text, so each drops `slice 8` from its
  expectations (and 007-US3-AS2's name its "leave for the merge"); the new 008 tests pin what
  replaces it. Nothing else in them changes. **Angelo** approves this restatement with the plan.
- **Rationale**: the deferral was the requirement of 004 and 007 until this slice; spec 008
  supersedes it, as 007 restated 006's leech threshold (007 R6).
- **Alternatives**: leaving "slice 8" in the skill texts (a dangling promise once it ships).

## R6. Tests read the skill files; no eval yet

- **Decision**: each scenario of the spec is a skill-file test in `tests/skills/`, named by its
  id, as for 004–007. No eval: no skill has misbehaved twice in real use (constitution IV).
- **Rationale**: every scenario is a skill-file scenario; the CLI behavior they use is covered
  by 001 and 007's tests.
