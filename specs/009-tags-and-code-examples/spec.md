# Feature Specification: Tags and Code Examples

**Feature Branch**: `009-tags-and-code-examples` | **Created**: 2026-11-16 | **Status**: Draft
**Input**: Slice 9 of `docs/design/2026-11-08-aletheia-design.md` §13: card rules from use (design §5, tags and profile; §6, rules 2 and 8). From the `prod` review of 2026-11-16: Angelo asked for a code example on four cards (#62tw, #k4km, #j3nx, #vsgy); `rust::crates::anyhow` and ten more tags were added by hand to cards whose topics no tag named (#87wx lacked `rust::traits`, #aes0 `rust::ownership`); he turned down the profile line «nunca he creado tipos de error propios» and had «nunca he usado `thiserror`» removed. Skill-only: the CLI changes nothing.

## User Scenarios & Testing _(mandatory)_

The tags in use and a compiler's exit status are facts the machine gives. Which topics a card rests on, whether it is about code, which example shows it, and whether a statement is general enough for the profile are judgment. Nothing is saved without Angelo's approval of the exact card or line (constitution IX).

### User Story 1 - A tag for each topic a card rests on (Priority: P1)

Capturing a card on `.context()` from `anyhow`, Claude lists the tags in use, finds `rust::error-handling` and none for the crate, and drafts the card with `rust::error-handling` and `rust::crates::anyhow (nuevo)`. A card on `String` vs `&str` gets `rust::strings` and `rust::ownership`, the concept it rests on. Later, "repasemos anyhow" finds every card on the crate.
**Independent Test**: in `prod` after the release, capture a card on a Rust crate; the draft reuses tags in use and tags the crate.

1. **009-US1-AS1** Given the tags in use, When Claude drafts a card, Then it gives the card one tag for each topic it rests on, reusing a tag in use before making a new one, and marks each tag not in use as new in the draft.
2. **009-US1-AS2** Given a card about a library, When Claude drafts it, Then one of its tags names the library under its ecosystem (`rust::crates::anyhow`), next to the subject's tag.
3. **009-US1-AS3** Given a card that builds on a concept another tag names (`rust::ownership` for `String` vs `&str`), When Claude drafts it, Then the card carries that tag too; a topic the card only mentions in passing gets no tag.
4. **009-US1-AS4** Given a rewrite or a replacement in review or prune, When Claude drafts it, Then its tags follow AS1–AS3, and the before and after show every tag added.

### User Story 2 - A code example in a card about code (Priority: P2)

Angelo captures a card on the `From` trait. The draft's answer gives the rule in two lines, then a block with `impl From<f64> for Celsius` and `.into()`, and Claude says it compiled it before showing the draft. In a review, when Angelo asks "dame un ejemplo en código" for a card saved before the slice, the rewrite adds the block the same way.
**Independent Test**: in `prod` after the release, capture a card on Rust code; the draft carries an example and says it compiled.

1. **009-US2-AS1** Given a card about code, When Claude drafts its answer, Then the answer carries an example in its own code block after its one to three lines, and the block does not count toward them, whatever its length.
2. **009-US2-AS2** Given the example's toolchain on the machine, When Claude drafts the example, Then it compiles or runs it before showing the draft, judges it by the exit status, fixes it until it passes, and says in the draft that it was checked.
3. **009-US2-AS3** Given no toolchain at hand, or an example that cannot run safely, When Claude drafts it, Then it shows the draft saying the example was not checked, and why.
4. **009-US2-AS4** Given a card not about code, When Claude drafts it, Then no example is forced into it.

### User Story 3 - A profile that stays general (Priority: P3)

In a review Angelo says "nunca he creado errores custom". Claude offers nothing for the profile: that is one thing he has not done, not his level in Rust. When he says "ya uso Docker a diario en el trabajo", Claude offers to change the Docker line.
**Independent Test**: in `prod`, state a narrow fact and then a level during a review; only the level gets an offer.

1. **009-US3-AS1** Given Angelo states a narrow fact inside an area (one crate, one flag, or one thing he has or has not done in it, such as «nunca he creado errores custom» under Rust), When the review or capture skill runs, Then Claude offers no profile line.
2. **009-US3-AS2** Given Angelo states his level in an area, his role or how he learns, When the review or capture skill runs, Then Claude offers the line as in 002, changing the area's line rather than adding a second one.

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
- **FR-002**: A card about code MUST carry an example in its own code block after its one to three lines; the block does not count toward them and has no length cap (design §6, rules 2 and 8).
- **FR-003**: Claude MUST compile or run an example before showing the draft when the toolchain is at hand, judge it by the exit status, never run one with side effects, and say in the draft whether the example was checked, and if not, why.
- **FR-004**: The review and capture skills MUST offer a profile line only for an area's level, Angelo's role or how he learns; never for a narrow fact inside an area: one crate, one flag, or one thing he has or has not done in it (design §5).
- **FR-005**: The CLI and the store change nothing: the example is part of the card's answer, and tags keep the format of 002.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In the first two weeks after the release, every card captured on code carries an example, and Angelo asks for an example on none of them in review.
- **SC-002**: In the first two weeks, no tag is added by hand to a card captured after the release.
- **SC-003**: In the first two weeks, every example a draft says was checked compiles or runs when tried again.
- **SC-004**: In the first two weeks, Angelo turns down no profile line for being too specific.

## Assumptions

- A library's tag uses its ecosystem's own word: `rust::crates::<name>`, `node::packages::<name>`.
- A card is about code when its answer rests on a language construct, a library's API, a command or a snippet; concepts of systems (the kernel, a VM) and comparisons of tools with no code in them are not.
- An area is what a profile line names («nunca he tocado Kubernetes», «uso Docker a diario»); a narrow fact sits inside one («nunca he creado errores custom» under Rust). Where one ends and the other begins is Angelo's call.
- Prune drafts its replacements and rewrites by `az-aletheia-add`'s card rules, so it follows US1 and US2 through them.
- `az-aletheia-add` reaches Claude only through a release; the review and prune skills are project-local and change when their files do.
