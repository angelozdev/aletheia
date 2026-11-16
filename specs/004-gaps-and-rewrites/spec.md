# Feature Specification: Gaps and Rewrites

**Feature Branch**: `004-gaps-and-rewrites` | **Created**: 2026-11-10 | **Status**: Draft
**Input**: Slice 4 of `docs/design/2026-11-08-aletheia-design.md` §13: gaps and badly written cards in review: prerequisite card, voided review, rewrite (design §5 review log flags `missing-prerequisite` and `badly-written`, voided review; §8.2 steps 9–10; §8.4 Rewrites). Angelo exercises it with "no recuerdo qué es X".

## Clarifications

### Session 2026-11-10

- Q: When a card on the missing concept exists, does Claude explain the concept first (design §8.2 step 9 as written) or ask the card first? → A: Ask it first, explaining nothing: its answer is the explanation, and its grade shows what Angelo remembers. Explaining first was rejected: he would answer what he had just heard, and FSRS would grow an interval he did not earn. Design §8.2 step 9 updated.
- Q: Which grades can a review flagged `badly-written` carry? → A: Any grade, a right answer included: Claude may void a review whenever the wording, not Angelo's memory, decided the answer. Only Again or Hard was rejected; the cost accepted is that a voided Good leaves the card's schedule as it was.
- Q: Is a card's text before a rewrite kept? → A: No: the edit replaces it. The voided review's rationale says why the card was rewritten, and from slice 5 every review keeps the question as asked. An edit history and bringing slice 5's asked question forward were rejected.

## User Scenarios & Testing _(mandatory)_

Telling a missing prerequisite from a badly written card, judging whether a card covers the missing concept, and drafting a rewrite are judgment (constitution II). What a flag does to scheduling, to the lists and to the caps are facts the CLI computes, never the skill.

### User Story 1 - A gap becomes a card to study (Priority: P1)

Reviewing #k7m2, on how a consumer group splits messages in Redis Streams, Angelo says "no recuerdo qué es un consumer group". Claude grades Again and flags the review as a missing prerequisite. It searches the deck for a card on consumer groups: if there is one, it asks it next, explaining nothing first, so its grade shows what Angelo remembers; if there is none, it explains the concept in two or three lines and offers that card, saved only if Angelo approves. The Again is a real failure: it reschedules #k7m2, which comes back before the session ends, and later counts as a gap of its topic, not toward a leech.
**Independent Test**: with #k7m2 and a card on what a consumer group is, answer #k7m2 "no recuerdo qué es un consumer group": see the consumer group card asked next, and #k7m2 again before the session ends.

1. **004-US1-AS1** Given a card due, When it is graded Again with the flag `missing-prerequisite`, Then the review is logged with the flag and the card is rescheduled like any Again (001 FR-005).
2. **004-US1-AS2** Given the flag `missing-prerequisite` with a final grade other than Again, both flags on one review, or a review asked as the prerequisite of a card that does not exist or of itself, When it is recorded, Then it exits 1 naming each problem and nothing is recorded.
3. **004-US1-AS3** Given card P graded in a session as the prerequisite of card X, When the session's list is asked, Then P does not count toward the session's cap, even when it comes back later in the session; if P was new, it does not count toward the day's new cards either (design §8.2 step 13).
4. **004-US1-AS4** Given the review skill file, When it is read, Then on a failure from a missing base concept it grades Again with the flag, searches through the installed `aletheia` for a card covering the concept, asks it next without explaining first and records it as that card's prerequisite when found, and otherwise explains the concept in two or three lines and offers the card through `az-aletheia-add` with its approval; at most one prerequisite per failed card.

### User Story 2 - A badly written card does not count (Priority: P2)

Angelo answers #9p3x wrong because its question can be read two ways. Claude says so in a line and voids the review: the miss says nothing about his memory, so the card's schedule stays as it was. The card leaves the lists until tomorrow, since he has now seen its answer. A right answer can be voided too, when the wording decided it (the question gives its answer away).
**Independent Test**: grade a due card with the flag `badly-written`; `card show` gives the same due and state as before, and the due list leaves it out until the next local day.

1. **004-US2-AS1** Given a card due, When it is graded with the flag `badly-written`, whatever the grade, Then the review is logged with the flag, both grades, the answer and the rationale, and the card's schedule (due, state, steps, reps, lapses, stability, difficulty, last review) is unchanged.
2. **004-US2-AS2** Given a card whose review was voided today, When the due list or a topic covering it is asked, Then it is absent; on the next local day it is listed as before.
3. **004-US2-AS3** Given a voided review in a session, When the list is asked, Then it counts toward the session's cap; on a new card it does not count toward the day's new cards, and the card stays new.
4. **004-US2-AS4** Given the review skill file, When it is read, Then when the wording, not Angelo's memory, decided the answer, right or wrong (the question can be read two ways, lacks context it should carry, asks something other than its key points, or gives its answer away), it says why in a line, records the review voided, and proposes a rewrite (US3); Angelo can dispute a voiding, or ask for one, as he disputes a grade.

### User Story 3 - Rewrite a card in place (Priority: P3)

Claude proposes clearer wording for #9p3x: the same knowledge, now naming the variant. Angelo approves the exact text and Claude saves it; the card keeps its id, its schedule and its reviews. He can also ask for a rewrite outside a voided review ("la pregunta de #9p3x se entiende mal").
**Independent Test**: edit a card's question and tags; `card show` gives the new text with the same id, due and state, and a topic of the new tag holds it.

1. **004-US3-AS1** Given an active card, When any of its type, question, answer, key points, situation or tags is edited, Then `card show` gives the new values and the others unchanged, with the same id, source, schedule and reviews, and the edit instant as its last update.
2. **004-US3-AS2** Given an edit that breaks a card rule (001 FR-001), names no field to change, names a field that cannot change (id, source, schedule), or names a card that does not exist, When it is saved, Then it exits 1 naming each problem and the card is unchanged.
3. **004-US3-AS3** Given an edited card, When the deck is searched for a word of its new text, Then it is found; a word only in its old text no longer finds it.
4. **004-US3-AS4** Given the review skill file, When it is read, Then it proposes a rewrite only when the card still asks for the same knowledge, shows the exact before and after, and saves through the installed `aletheia` only after Angelo approves, with his edits; when the fix would change what the key points mean, it says the card needs replacing, which arrives with slice 7, and leaves it as is.

### Edge Cases

- The card on the missing concept was already shown in this session: Claude explains in two or three lines and does not ask it again.
- The prerequisite card fails for a missing base concept too: it is flagged, Claude explains, and pulls nothing more; a review is not a lesson (design §2).
- A prerequisite card graded earlier today is still asked: Angelo just said he does not remember it, so its grade is honest.
- A prerequisite card created in the review is new like any capture (source `repaso #<id>`) and is not asked in this session: Angelo read its answer when approving it.
- A voided review on a (re)learning card leaves its step as it was; the next day it is due as before, overdue if its step ended.
- A rewrite does not change the grade being settled; a voided review stays voided after it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A review MAY carry one flag, `missing-prerequisite` or `badly-written`, never both. `missing-prerequisite` requires the final grade Again; such a review is logged and scheduled like any other (001 FR-005). `badly-written` goes with any grade.
- **FR-002**: A review flagged `badly-written` is voided: it is logged with its grades, answer and rationale, and leaves the card's schedule unchanged. A card with a review voided today is left out of every list until the next local day. A voided review counts toward its session's cap and never toward the day's new cards.
- **FR-003**: A review MAY name the card it was asked as the prerequisite of, which must exist and be another card. A card whose first review in a session is a prerequisite one does not count toward that session's cap; a new card first graded as a prerequisite does not count toward the day's new cards.
- **FR-004**: The CLI MUST edit an active card in place: any of type, question, answer, key points, situation and tags, under the rules of 001 FR-001, keeping its id, source, schedule and reviews; the search sees the new text at once (002 FR-002). An invalid edit changes nothing.
- **FR-005**: On a failure from a missing base concept, the review skill MUST grade Again with the flag, search the deck through the CLI for a card covering the concept, and either ask that card next and record it as the failed card's prerequisite, or explain the concept in two or three lines and offer the card through `az-aletheia-add`, saved only with Angelo's approval. A card found is asked before anything is explained: its answer is the explanation. At most one prerequisite per failed card, and none already shown in the session.
- **FR-006**: When the wording, not Angelo's memory, decided the answer, right or wrong, the review skill MUST say why in a line, record the review voided and propose a rewrite of the same knowledge, showing the exact before and after, saved only after Angelo approves it. A fix that changes what the key points mean waits for slice 7. Angelo MAY dispute a voiding or ask for one.
- **FR-007**: The effect of each flag on scheduling, on the lists and on both caps MUST be computed by the CLI and covered by its tests; the skill only says which flag applies (constitution II). Every question about a card MUST be answered by running `aletheia` (constitution VIII).

### Key Entities

- **Review flag**: `missing-prerequisite`, a real failure that counts as a gap of the card's topics; or `badly-written`, a voided review.
- **Voided review**: kept in the log; schedules nothing; counts only toward its session's cap.
- **Prerequisite review**: the review of a card asked because another card failed for its lack; names that card.
- **Card edit**: replaces content fields of a card in place, keeping no copy of the old text; the schedule and the reviews stay.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo says "no recuerdo qué es X" in a review in `prod`, and Claude asks the card on X or offers one, without a command or a `/`.
- **SC-002**: In the first two weeks, Angelo disputes at most 1 in 10 of the flags Claude sets (missing prerequisite or badly written).
- **SC-003**: In the first two weeks, no card rewritten for its wording has its next review voided for its wording again.
- **SC-004**: No voided review ever changes when a card comes back.

## Assumptions

- Every card is active in this slice; archive, replace, split and merge arrive with slice 7, and so does a rewrite whose meaning changes; archive arrived with spec 007, and replace, split and merge with spec 008, as `card add` then `card archive`.
- Claude asks each question as stored; rephrasing it on every review, and voiding a miss caused by the rephrasing, arrive with slice 5 (design §8.2 step 16).
- The text before a rewrite is not kept; the voided review's rationale records why the card was rewritten.
- Gap counts, retention and leech detection are read in slices 6 and 7; this slice records the flags they read, and voided reviews stay out of both.
- A prerequisite card created during a review follows the daily cap like any capture: the design exempts cards pulled in as prerequisites, not those created.
- US1 and US2 need a schema change; US3 does not.
- Command names, options, output fields and the flags' stored form are left to the plan.
