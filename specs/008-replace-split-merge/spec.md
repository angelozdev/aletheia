# Feature Specification: Replace, Split and Merge

**Feature Branch**: `008-replace-split-merge` | **Created**: 2026-11-15 | **Status**: Draft
**Input**: Slice 8 of `docs/design/2026-11-08-aletheia-design.md` §13: replace, split and merge, new cards with fresh scheduling in place of archived ones (design §8.4, "Rewrites"). Spec 007 left them, and a rewrite that changes what the key points mean, to this slice. Angelo exercises it by merging two overlapping cards into one.

## Clarifications

### Session 2026-11-15

- Q: Does a replacement need a new command or a change to the store? → A: No: a replacement is the new cards saved with `card add` (001) and then each old card archived with `card archive` (007), its reason naming the new ones. A new card from a replacement is a new card like any other: it waits behind new-per-day and can come up the day it is saved. A `card replace` command writing a `card_replacements` link table, so the new cards could skip the new-card cap and first come up the next day (first chosen in this session, with design §8.4's exemption), was rejected in planning as more than the slice needs; both rules are dropped with it.
- Q: Is merge at capture in this slice? → A: Yes: when `az-aletheia-add` finds an active card that asks nearly the same as a draft, it also offers to merge both into one card, the same way, so the overlap does not enter the deck (constitution IX: the filter acts at entry and at exit). Prune alone, with the pair entering and merged later, was rejected.
- Q: What archive reason does a replaced card keep? → A: The link and Angelo's why, both required: "reemplazada por #b4n8, #c5p9: tenía dos ideas en una". The skill writes the link from the ids `card add` prints and asks for his why, which `card archive` already requires (007-US1-AS2), so every retired card shows his reason (007 SC-002). The link alone and his why as an optional addition were rejected.
- Q: What does `az-aletheia-add` do when a draft repeats a card archived by a replacement? → A: It follows the link in the archive reason: it compares the draft with the active card that replaced it, as with any active card (drop, save or merge), and does not offer to restore the replaced one, which would leave two cards saying the same. The three choices of 007-US1-AS7 for it, restore included, were rejected; they stay for a card archived without a replacement.

## User Scenarios & Testing _(mandatory)_

Saving the new cards and archiving the old ones are facts the CLI already records (001, 007). Whether two cards overlap, whether a card holds two ideas, whether a fix changes what the key points mean, and how the new cards are worded are judgment. Nothing is replaced without Angelo's approval of the exact new cards and his why (constitution IX).

### User Story 1 - Merge two overlapping cards (Priority: P1)

At prune, #9p3x and #w2ab ask nearly the same about acks, one in Redis Streams and one in RabbitMQ. Angelo chooses merge. Claude drafts one card that states the concept without naming a technology and gives an example in each, quotes both old questions next to it, and he approves it with an edit: "se solapaban, mejor una con ambos ejemplos". It is saved as #a7k2, a new card whose source names both; #9p3x and #w2ab are archived with "reemplazada por #a7k2: se solapaban, mejor una con ambos ejemplos", their reviews kept.
**Independent Test**: read the prune skill file for the merge choice, its approval, the save and the two archives.

1. **008-US1-AS1** Given the prune skill file, When it is read, Then for an overlap it also offers merge: one draft that states the concept without naming a technology, with an example in each, following the quality rules (design §6), shown with both old questions; only after Angelo approves the exact draft, with his edits, and gives his why, it saves the draft through the installed `aletheia card add`, its source naming the old cards, and then archives each old card through `aletheia card archive` with "reemplazada por #<id>: <why>"; keep the pair, archive one or leave it stay as in 007-US3-AS2, except that a pair left is no longer "for the merge".
2. **008-US1-AS2** Given the prune skill file, When it is read, Then when an archive fails after the save, it says which old card is still active beside the new one and archives it again, never saving the draft a second time.

### User Story 2 - Split or replace a card (Priority: P2)

#k7m2 is a leech, 5 failures. Claude reads it: it asks how a consumer group splits messages and what happens to the ones not acked, two ideas in one. Angelo chooses split; Claude drafts two cards, one idea each, and he approves them; they are saved as #b4n8 and #c5p9, and #k7m2 is archived with "reemplazada por #b4n8, #c5p9: tenía dos ideas en una". In a review, #m4cd's key points turn out to be wrong, and fixing them changes what the card asks: Claude offers a replacement instead of an edit, after recording the grade.
**Independent Test**: read the prune and review skill files for split and replace, the save and the archive.

1. **008-US2-AS1** Given the prune skill file, When it is read, Then for a leech it also offers split, when the card holds two ideas, and replace, when the fix changes what the key points mean; for a situation that no longer applies, replace when the card changes meaning, an in-place edit otherwise (004 US3); and wherever 007 said a card "needs replacing, which arrives with slice 8", it offers the replacement, saved and archived as in 008-US1-AS1.
2. **008-US2-AS2** Given the review skill file, When it is read, Then when a fix would change what the key points mean or a card holds two ideas, it offers replace or split after the grade is recorded, instead of saying it arrives with slice 8 (004-US3-AS4); it shows the old card and the exact drafts, and saves and archives as in 008-US1-AS1 only after Angelo approves.

### User Story 3 - Merge at capture (Priority: P3)

Capturing in another repo, Angelo drafts a card on RabbitMQ acks; the duplicate search finds #9p3x on Redis Streams acks. Claude offers to merge the draft and #9p3x into one card, as in US1, instead of only dropping or saving the draft.
**Independent Test**: read the `az-aletheia-add` skill file for the merge choice and for a match archived by a replacement.

1. **008-US3-AS1** Given the `az-aletheia-add` skill file, When it is read, Then when a draft asks nearly the same as an active card, it offers to drop the draft, save it, or merge both into one card shown with the old question, saved and archived as in 008-US1-AS1 only after Angelo approves.
2. **008-US3-AS2** Given the `az-aletheia-add` skill file, When it is read, Then when a draft repeats a card archived with "reemplazada por #<id>", it shows the active card that replaced it, through the installed `aletheia card show`, and judges the draft against that one as in AS1, without offering to restore the replaced card; 007-US1-AS7 stays for a card archived without a replacement.

### Edge Cases

- A new card from a replacement is a new card: new-per-day can hold it back, and if there is room it can come up the day it is saved, even in the session running.
- A draft that repeats a card other than the ones it replaces is flagged by the duplicate search (002) as usual; the cards it replaces are not.
- Restoring a replaced card (007-US1-AS3) works; the new card stays active, and Angelo has both until he prunes one.
- A replaced card's keeps and reviews stay with it; the new card starts with none, so it is not a leech nor not useful from the old card's history.
- A new card can itself be replaced later; at capture Claude follows each "reemplazada por" to the cards active now; when none is, the archived card is handled as in 007-US1-AS7.
- Two old cards with different tags: the new card takes the tags of its draft.
- A fix that keeps what the card asks stays an in-place edit (004 US3), keeping the schedule.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The prune, review and `az-aletheia-add` skills MUST offer merge, split or replace where the card calls for it and show the old cards and the exact drafts; only on Angelo's approval and with his why, they MUST save the new cards with `card add`, their source naming the old cards, and then archive each old card with `card archive` and the reason "reemplazada por #<id>[, #<id>…]: <why>", through the installed `aletheia`, in Spanish.
- **FR-002**: `az-aletheia-add` MUST follow a "reemplazada por" reason to the active card that replaced it and judge a draft against that one, not offer to restore the replaced card.
- **FR-003**: Nothing is deleted (INV-02) and every archive keeps its reason (INV-03); the CLI changes nothing for this slice.

### Key Entities

- **Replacement**: the new cards saved and the old cards archived in their place; the old card's archive reason names the new ones, and each new card's source names the old ones.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo merges an overlapping pair in `prod` through the prune skill, without a command or a `/`.
- **SC-002**: In the first two weeks, no card is merged, split or replaced without his approval of the exact new cards, and every card retired that way names its replacement and his why.
- **SC-003**: In the first two weeks, every replacement ends with its new cards active and its old cards archived; none leaves an old card active beside its replacement.

## Assumptions

- Merge, split and replace are one pattern with different shapes (many to one, one to many, one to one): `card add`, then `card archive` for each old card.
- The link is text: the old card's archive reason and the new card's source. No command reads it; Claude does.
- The new cards follow the card rules of 001 and the quality rules of design §6; the duplicate search is the skill's, as in 002.
- `az-aletheia-add` reaches Claude only through a release, so US3 is seen in `prod` after it.
