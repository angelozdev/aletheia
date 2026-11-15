# Feature Specification: Replace, Split and Merge

**Feature Branch**: `008-replace-split-merge` | **Created**: 2026-11-15 | **Status**: Draft
**Input**: Slice 8 of `docs/design/2026-11-08-aletheia-design.md` §13: replace, split and merge, new cards with fresh scheduling in place of archived ones (design §8.4, "Rewrites"). Spec 007 left them, and a rewrite that changes what the key points mean, to this slice. Angelo exercises it by merging two overlapping cards into one.

## Clarifications

### Session 2026-11-15

- Q: When does a new card from a replacement first come up? → A: From tomorrow, the start of the next local day, in the due list and in topic review, as a voided review hides its card (004): Angelo has just read the old cards and approved the draft, so a first grade today would measure that minute, not his memory. Coming up now, as any card added, was rejected: in a review it would come back in the same session, graded Easy from what he just read.
- Q: Is merge at capture in this slice? → A: Yes: when `az-aletheia-add` finds an active card that asks nearly the same as a draft, it also offers to merge both into one card, through the same replacement, so the overlap does not enter the deck (constitution IX: the filter acts at entry and at exit). Prune alone, with the pair entering and merged later, was rejected.
- Q: What archive reason does a replaced card keep? → A: The link and Angelo's why, both required: "reemplazada por #b4n8, #c5p9: tenía dos ideas en una". The CLI writes the link from the new ids and refuses a replacement without his why, as an archive without a reason (007-US1-AS2), so every retired card shows his reason (007 SC-002). The link alone, written by the CLI, and his why as an optional addition were rejected.
- Q: What does `az-aletheia-add` do when a draft repeats a card archived by a replacement? → A: It follows the link: it compares the draft with the active card that replaced it, as with any active card (drop, save or merge), and does not offer to restore the replaced one, which would leave two cards saying the same. The three choices of 007-US1-AS7 for it, restore included, were rejected; they stay for a card archived without a replacement.

## User Scenarios & Testing _(mandatory)_

Saving the new cards, archiving the old ones and the link between them are facts the CLI records in one step (constitution II). Whether two cards overlap, whether a card holds two ideas, whether a fix changes what the key points mean, and how the new cards are worded are judgment. Nothing is replaced without Angelo's approval of the exact new cards (constitution IX).

### User Story 1 - Merge two overlapping cards (Priority: P1)

At prune, #9p3x and #w2ab ask nearly the same about acks, one in Redis Streams and one in RabbitMQ. Angelo chooses merge. Claude drafts one card that states the concept without naming a technology and gives an example in each, quotes both old questions next to it, and he approves it with an edit. It is saved as #a7k2, a new card; #9p3x and #w2ab are archived with "reemplazada por #a7k2: se solapaban, mejor una con ambos ejemplos", their reviews kept. #a7k2 does not wait behind the new-card cap.
**Independent Test**: replace two active cards with one draft; the new card is saved as new and names both, both old cards are archived naming it, it is due from tomorrow even with new-per-day reached, and a failure in any part changes nothing.

1. **008-US1-AS1** Given one or more active cards, one or more card drafts and Angelo's why, When the cards are replaced by the drafts, Then in one step each draft is saved as a new card (001 FR-001, fresh scheduling) that names the cards it replaces, and each old card is archived (007-US1-AS2) with the reason "reemplazada por #<id>[, #<id>…]: <why>", the link naming the new cards, at the same instant, its schedule and reviews kept. A blank why, an invalid draft (001's rules), or an old card that does not exist, is archived or is named twice, exits 1 naming it, and nothing changes.
2. **008-US1-AS2** Given a new card from a replacement, When it is shown, Then it gives the cards it replaces; each old card gives its archive reason naming it (007-US1-AS2).
3. **008-US1-AS3** Given new-per-day already reached today, When the due list is asked, Then a new card from a replacement is not held back, and its first review does not count toward new-per-day; the due list and topic review give it only from the start of tomorrow, local day.
4. **008-US1-AS4** Given the prune skill file, When it is read, Then for an overlap it also offers merge: one draft that states the concept without naming a technology, with an example in each, following the quality rules (design §6), shown with both old questions; it saves only after Angelo approves the exact draft, with his edits, through the installed `aletheia`, with his why in his words; keep the pair, archive one or leave it stay as in 007-US3-AS2, except that a pair left is no longer "for the merge".

### User Story 2 - Split or replace a card (Priority: P2)

#k7m2 is a leech, 5 failures. Claude reads it: it asks how a consumer group splits messages and what happens to the ones not acked, two ideas in one. Angelo chooses split; Claude drafts #b4n8 and #c5p9, one idea each, and he approves them; #k7m2 is archived with "reemplazada por #b4n8, #c5p9: tenía dos ideas en una". In a review, #m4cd's key points turn out to be wrong, and fixing them changes what the card asks: Claude offers a replacement instead of an edit, after recording the grade.
**Independent Test**: replace one card with two drafts; both are saved as new and name it, and it is archived naming both, with the why.

1. **008-US2-AS1** Given the prune skill file, When it is read, Then for a leech it also offers split, when the card holds two ideas, and replace, when the fix changes what the key points mean; for a situation that no longer applies, replace when the card changes meaning, an in-place edit otherwise (004 US3); and wherever 007 said a card "needs replacing, which arrives with slice 8", it offers the replacement.
2. **008-US2-AS2** Given the review skill file, When it is read, Then when a fix would change what the key points mean or a card holds two ideas, it offers replace or split after the grade is recorded, instead of saying it arrives with slice 8 (004-US3-AS4); it shows the old card and the exact drafts, and saves only after Angelo approves.

### User Story 3 - Merge at capture (Priority: P3)

Capturing in another repo, Angelo drafts a card on RabbitMQ acks; the duplicate search finds #9p3x on Redis Streams acks. Claude offers to merge the draft and #9p3x into one card, as in US1, instead of only dropping or saving the draft.
**Independent Test**: read the skill file for the merge choice and its approval.

1. **008-US3-AS1** Given the `az-aletheia-add` skill file, When it is read, Then when a draft asks nearly the same as an active card, it offers to drop the draft, save it, or merge both into one card shown with the old question, replacing the active card only after Angelo approves.
2. **008-US3-AS2** Given the `az-aletheia-add` skill file, When it is read, Then when a draft repeats a card archived by a replacement, it shows the active card that replaced it, through the installed `aletheia`, and judges the draft against that one as in AS1, without offering to restore the replaced card; 007-US1-AS7 stays for a card archived without a replacement.

### Edge Cases

- A draft that repeats a card other than the ones it replaces is flagged by the duplicate search (002) as usual; the cards it replaces are not.
- Restoring a replaced card (007-US1-AS3) works; the new card stays active and keeps its link, and Angelo has both until he prunes one.
- A replaced card's keeps and reviews stay with it; the new card starts with none, so it is not a leech nor not useful from the old card's history.
- A new card can itself be replaced later; each replacement records its own link, and at capture Claude follows the links to the cards active now; when none is, the archived card is handled as in 007-US1-AS7.
- Two old cards with different tags: the new card takes the tags of its draft.
- A fix that keeps what the card asks stays an in-place edit (004 US3), keeping the schedule.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST replace one or more active cards with one or more new cards in one step, all or nothing: each new card saved with fresh scheduling and the cards it replaces, each old card archived with a reason that links the new ones and gives Angelo's why, which is required. Nothing is deleted (INV-02) and no archive changes (INV-03).
- **FR-002**: A new card from a replacement MUST NOT be held back by new-per-day nor count toward it, and MUST first come up the day after it is saved.
- **FR-003**: Showing a card MUST give the cards it replaces.
- **FR-004**: The prune, review and `az-aletheia-add` skills MUST offer merge, split or replace where the card calls for it, show the old cards and the exact drafts, and save only on Angelo's approval, with his why, through the installed `aletheia`, in Spanish.

### Key Entities

- **Replacement**: one step that retires one or more cards and creates one or more in their place; each new card names the cards it replaces.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo merges an overlapping pair in `prod` through the prune skill, without a command or a `/`.
- **SC-002**: In the first two weeks, no card is merged, split or replaced without his approval of the exact new cards, and every card retired that way names its replacement.
- **SC-003**: In the first two weeks, no new card from a replacement is held back by the new-card cap.
- **SC-004**: A replacement answers in under 1 second on a deck of 1,000 cards and 20,000 reviews.

## Assumptions

- Merge, split and replace are one operation with different shapes (many to one, one to many, one to one); the CLI does not tell them apart.
- The link part of the archive reason is written by the CLI, in Spanish, from the new ids; the why is Angelo's, in his words.
- Only new-per-day exempts a new card from a replacement: in a session it takes the places for new cards like any new card (003).
- The new cards follow the card rules of 001 and the quality rules of design §6; the duplicate search is the skill's, as in 002.
- `az-aletheia-add` reaches Claude only through a release, so US3 is seen in `prod` after it.
- Command names, flags, output fields and the store shape are left to the plan.
