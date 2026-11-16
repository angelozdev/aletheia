# Feature Specification: Tags and Code Examples

**Feature Branch**: `009-tags-and-code-examples` | **Created**: 2026-11-16 | **Status**: Draft
**Input**: Slice 9 of `docs/design/2026-11-08-aletheia-design.md` §13: card rules from use (design §5, tags and profile; §6, rules 2, 7 and 8). From the `prod` review of 2026-11-16: Angelo asked for a code example on four cards (#62tw, #k4km, #j3nx, #vsgy); `rust::crates::anyhow` and ten more tags were added by hand to cards whose topics no tag named (#87wx lacked `rust::traits`, #aes0 `rust::ownership`); he turned down the profile line «nunca he creado tipos de error propios» and had «nunca he usado `thiserror`» removed. Skill-only: the CLI changes nothing.

## Clarifications

### Session 2026-11-16

- Q: How is the tag of a library outside Rust written? → A: Under its language, with its ecosystem's own word for a library: `rust::crates::anyhow`, `typescript::packages::zod`, `python::packages::requests`. One word for every ecosystem (`rust::libs::anyhow`, renaming the tags in use) and the library as a root tag (`anyhow`) were rejected.
- Q: Which cards carry a code example? → A: Every card with something to run: code, a command or a short program that shows its idea, in a language card (a construct, a library's API, a snippet) or in a system one (a system call under `strace`, a container under `docker`). A comparison of tools or a concept no command or program shows gets none. Only cards about code, and only cards about a programming language, were rejected.
- Q: When Angelo states a narrow fact that would change his level in an area («ya domino Lambda» against «estudiando AWS»), does Claude offer to change the area's line? → A: Yes, as the area's new line in general words («uso AWS en proyectos»), never naming the narrow fact. Offering nothing for any narrow fact, and a line naming it («AWS: domino Lambda»), were rejected.
- Q: Does a rewrite that changes a card's question, answer or key points search the deck for repeats first? → A: Yes, every such rewrite or replacement, in review or prune, as a capture searches a draft; a repeat or overlap is flagged on the before and after. Searching only when a rewrite widens what the card asks, and leaving overlaps to prune, were rejected.

## User Scenarios & Testing _(mandatory)_

The tags in use and a compiler's exit status are facts the machine gives. Which topics a card rests on, whether it has something to run, which example shows it, and whether a statement is general enough for the profile are judgment. Nothing is saved without Angelo's approval of the exact card or line (constitution IX).

### User Story 1 - A tag for each topic a card rests on (Priority: P1)

Capturing a card on `.context()` from `anyhow`, Claude lists the tags in use, finds `rust::error-handling` and none for the crate, and drafts the card with `rust::error-handling` and `rust::crates::anyhow (nuevo)`. A card on `String` vs `&str` gets `rust::strings` and `rust::ownership`, the concept it rests on. Later, "repasemos anyhow" finds every card on the crate.
**Independent Test**: in `prod` after the release, capture a card on a Rust crate; the draft reuses tags in use and tags the crate.

1. **009-US1-AS1** Given the tags in use, When Claude drafts a card, Then it gives the card one tag for each topic it rests on, reusing a tag in use before making a new one, and marks each tag not in use as new in the draft.
2. **009-US1-AS2** Given a card about a library, When Claude drafts it, Then one of its tags names the library under its language, with its ecosystem's word for a library (`rust::crates::anyhow`, `typescript::packages::zod`), next to the subject's tag.
3. **009-US1-AS3** Given a card that builds on a concept another tag names (`rust::ownership` for `String` vs `&str`), When Claude drafts it, Then the card carries that tag too; a topic the card only mentions in passing gets no tag.
4. **009-US1-AS4** Given a rewrite or a replacement in review or prune, When Claude drafts it, Then its tags follow AS1–AS3, and the before and after show every tag added.

### User Story 2 - A code example in a card with something to run (Priority: P2)

Angelo captures a card on the `From` trait. The draft's answer gives the rule in two lines, then a block with `impl From<f64> for Celsius` and `.into()`, and Claude says it compiled it before showing the draft. In a review, when Angelo asks "dame un ejemplo en código" for a card saved before the slice, the rewrite adds the block the same way. A card on system calls shows them under `strace`, and says it was not checked on a machine without `strace`.
**Independent Test**: in `prod` after the release, capture a card on Rust code; the draft carries an example and says it compiled.

1. **009-US2-AS1** Given a card with something to run, When Claude drafts its answer, Then the answer carries an example in its own code block after its one to three lines, and the block does not count toward them, whatever its length.
2. **009-US2-AS2** Given the example's toolchain on the machine, When Claude drafts the example, Then it compiles or runs it before showing the draft, judges it by the exit status, fixes it until it passes, and says in the draft that it was checked.
3. **009-US2-AS3** Given no toolchain at hand, or an example that cannot run safely, When Claude drafts it, Then it shows the draft saying the example was not checked, and why.
4. **009-US2-AS4** Given a card with nothing to run (a comparison of tools, a concept no command or program shows), When Claude drafts it, Then no example is forced into it.

### User Story 3 - A profile that stays general (Priority: P3)

In a review Angelo says "nunca he creado errores custom". Claude offers nothing for the profile: that is one thing he has not done, not his level in Rust. When he says "ya domino Lambda" against «estudiando AWS», Claude offers the AWS line in general words, «uso AWS en proyectos», never naming Lambda. When he says "ya uso Docker a diario en el trabajo", Claude offers to change the Docker line.
**Independent Test**: in `prod`, during a review, state a narrow fact that leaves a level as it is, then a level; only the level gets an offer.

1. **009-US3-AS1** Given Angelo states a narrow fact inside an area (one crate, one flag, or one thing he has or has not done in it, such as «nunca he creado errores custom» under Rust), When the review or capture skill runs, Then Claude offers no profile line, unless the fact changes the area's level (AS3).
2. **009-US3-AS2** Given Angelo states his level in an area, his role or how he learns, When the review or capture skill runs, Then Claude offers the line as in 002, changing the area's line rather than adding a second one.
3. **009-US3-AS3** Given Angelo states a narrow fact that changes his level in an area («ya domino Lambda» against «estudiando AWS»), When the review or capture skill runs, Then Claude offers to change the area's line to its new level in general words, without naming the narrow fact.

### User Story 4 - A rewrite or a replacement searched like a capture (Priority: P4)

In a review Angelo asks to widen #xrrj to `.map`, `.filter` and `.take_while`. Before showing the before and after, Claude searches the deck with the new question and answer, finds #805p, and flags `⚠ se solapa con #805p: …`, so the overlap is decided before the change is saved, not found later in a prune.
**Independent Test**: in `prod`, ask in a review to widen a card toward another one in the deck; the before and after, or the replacement's draft, carries the flag.

1. **009-US4-AS1** Given a rewrite or a replacement in review or prune that changes the question, the answer or the key points, When Claude drafts it, Then it searches the deck with the new fields as `az-aletheia-add` searches a draft, sets the card itself aside, flags each repeat or overlap on the before and after, or on the draft, as `az-aletheia-add` flags a draft, and offers what it offers for one.
2. **009-US4-AS2** Given a rewrite that changes only the tags, the situation or the type, When Claude drafts it, Then it runs no search.

### Edge Cases

- No tag in use fits a topic: Claude makes one in the tag format (002) and marks it new, so a typo or a near-duplicate tag shows before it is saved.
- An example that needs a library is checked in a throwaway project outside the repo, `data/` and `~/.aletheia/` (INV-01).
- An example with side effects (a command that deletes, writes outside a throwaway folder or calls a server) is never run; the draft says it was not checked.
- An example that fails is fixed before the draft is shown; one that cannot be fixed is shown as failing, never as checked.
- Cards saved before the slice keep their tags and answers; an example or a tag comes in through a rewrite when Angelo asks.
- Narrow lines already in `PROFILE.md` stay until Angelo removes them; the skills do not clean the profile on their own.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: When drafting a card (`az-aletheia-add`) or the new fields of a rewrite or replacement (review, prune), Claude MUST read the tags in use through the installed `aletheia tag list`, give the card one tag per topic it rests on (its subject, the concept it builds on, the library it is about), reuse a tag in use before making one, and mark a new tag in the draft.
- **FR-002**: A card with something to run MUST carry an example in its own code block after its one to three lines; the block does not count toward them and has no length cap (design §6, rules 2 and 8).
- **FR-003**: Claude MUST compile or run an example before showing the draft when the toolchain is at hand, judge it by the exit status, never run one with side effects, and say in the draft whether the example was checked, and if not, why.
- **FR-004**: The review and capture skills MUST offer a profile line only for an area's level, Angelo's role or how he learns; never a line for a narrow fact inside an area: one crate, one flag, or one thing he has or has not done in it. A narrow fact that changes the area's level is offered as the area's new line in general words (design §5).
- **FR-005**: The CLI and the store change nothing: the example is part of the card's answer, and tags keep the format of 002.
- **FR-006**: A rewrite or a replacement in review or prune that changes the question, the answer or the key points MUST be searched against the deck before it is shown, as `az-aletheia-add` searches a draft, the card itself set aside; each repeat or overlap is flagged on the before and after, or on the draft (design §6, rule 7).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In the first two weeks after the release, every card captured with something to run carries an example, and Angelo asks for an example on none of them in review.
- **SC-002**: In the first two weeks, no tag is added by hand to a card captured after the release.
- **SC-003**: In the first two weeks, every example a draft says was checked compiles or runs when tried again.
- **SC-004**: In the first two weeks, Angelo turns down no profile line for being too specific.
- **SC-005**: In the first two weeks, no prune finds an overlap made by a rewrite saved after the release.

## Assumptions

- A card has something to run when code, a command or a short program shows its idea: a language construct, a library's API, a command, a snippet, or a system mechanism a command makes visible (a system call under `strace`). A comparison of tools or a concept no command or program shows has nothing to run.
- An area is what a profile line names («nunca he tocado Kubernetes», «uso Docker a diario»); a narrow fact sits inside one («nunca he creado errores custom» under Rust). Where one ends and the other begins, and whether a narrow fact changes an area's level, is Claude's reading offered for Angelo's approval of the exact line.
- Prune drafts its replacements and rewrites by `az-aletheia-add`'s card rules, so it follows US1 and US2 through them; US4 and FR-006 name prune themselves.
- `az-aletheia-add` reaches Claude only through a release; the review and prune skills are project-local and change when their files do.
