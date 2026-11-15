# Feature Specification: Varied Questions

**Feature Branch**: `005-varied-questions` | **Created**: 2026-11-11 | **Status**: Draft
**Input**: Slice 5 of `docs/design/2026-11-08-aletheia-design.md` §13: varied questions. Claude rephrases each card's question on every review, the key points stay fixed, and the question as asked is logged with the review (design §8.2 step 16). A miss caused by Claude's rephrasing is voided without rewriting the card, under its own flag `badly-rephrased`, so stats and prune never take it for a badly written card (spec 004 research R11). Angelo exercises it with a card seen before that comes back worded differently.

## Clarifications

### Session 2026-11-11

- Q: Does the CLI require the question as asked on every new review, rejecting a grade without it? → A: Yes: a grade with none, or a blank one, exits 1 and records nothing. The CLI checks only that it is there; whether it is the question Claude really asked, and whether it differs from the stored one, is judgment it cannot see. Optional in the CLI, left to the skill, was rejected: a forgotten question would reach the log with no test to catch it.
- Q: Which grades can a review flagged `badly-rephrased` carry? → A: Any grade, a right answer included, with exactly `badly-written`'s effects: Claude voids it whenever its rephrasing, not Angelo's memory, decided the answer, as when it gave the answer away. Only Again or Hard was rejected: a hint would earn the card an interval Angelo did not earn.
- Q: When Angelo does not understand a rephrasing and Claude rewords it before he answers, which wording is recorded? → A: Only the last one, the one he answered; the review is voided or not by the usual rule, on that wording. Keeping every wording (a list, not one text) and always voiding such a review were rejected. The cost accepted: a rephrasing Angelo caught before answering is not counted by SC-002.

## User Scenarios & Testing _(mandatory)_

Rephrasing a question, judging whether a rephrasing still asks for the same key points, and telling a bad rephrasing from a badly written card are judgment (constitution II). What a flag does to scheduling, to the lists and to the caps, and what the log keeps, are facts the CLI computes, never the skill.

### User Story 1 - A card comes back worded differently (Priority: P1)

#k7m2 is stored as "En Redis Streams, ¿cómo reparte un consumer group los mensajes entre sus consumidores?". Two weeks later Claude asks it as "Tienes dos workers leyendo el mismo stream de Redis con un consumer group: ¿cómo se reparten los mensajes?". Angelo has to recall how the group splits messages, not recognize a sentence he has read before. Claude grades against the stored key points, and the log keeps the question exactly as Claude asked it.
**Independent Test**: review a card already reviewed once; its question comes worded differently, its grade follows the stored key points, and `card show` gives the stored question unchanged.

1. **005-US1-AS1** Given a card due, When it is graded with the question as asked, Then the review is logged with that question, and the card's stored question is unchanged.
2. **005-US1-AS2** Given a grade with no question as asked, or a blank one, When it is recorded, Then it exits 1 naming the problem, and nothing is recorded.
3. **005-US1-AS3** Given the review skill file, When it is read, Then it asks every question rephrased, and records the question as asked. The rephrasing asks for the same key points and names the technology and the variant. It keeps code and commands verbatim and gives no hint the stored question does not give. It is worded differently from the stored question and from any wording asked earlier in the session. The grade is checked against the stored key points.

### User Story 2 - A bad rephrasing does not count (Priority: P2)

Claude asks #9p3x as "¿Qué le pasa al mensaje cuando el consumidor responde?", dropping the `ack` the stored question names. Angelo answers about something else. Claude says its rephrasing was ambiguous and voids the review under `badly-rephrased`: the card's schedule stays as it was, nothing is rewritten, and stats and prune will not count it against the card.
**Independent Test**: grade a due card with the flag `badly-rephrased`; `card show` gives the same due and state as before, and the due list leaves it out until the next local day.

1. **005-US2-AS1** Given a card due, When it is graded with the flag `badly-rephrased`, whatever the grade, Then the review is logged with the flag, both grades, the answer, the rationale and the question as asked, and the card's schedule is unchanged.
2. **005-US2-AS2** Given a card whose review was voided as `badly-rephrased` today, When the due list or a topic covering it is asked, Then it is absent until the next local day; the review counts toward its session's cap and not toward the day's new cards.
3. **005-US2-AS3** Given the review skill file, When it is read, Then it handles a rephrasing that decided the answer, right or wrong. It says so in a line, records the review voided as `badly-rephrased`, and proposes no rewrite. When the stored wording would have decided it too, the review is `badly-written` and a rewrite is proposed instead (004-US2-AS4). Angelo can dispute either flag, or ask for one.

### Edge Cases

- A `code` or `command` card: the code block, the commands and their flags stay as stored; only the words around them change.
- A question so short that no rewording keeps what it asks: Claude asks it as stored, and records that as the question asked.
- Angelo asks for the stored wording ("pregúntamela como está"): Claude asks it as stored, records it as asked, and goes back to rephrasing on the next card.
- Angelo does not understand a rephrasing ("¿responde cómo?"): Claude rewords it before he answers, and records only the wording he answered.
- A card shown again in the same session, such as one graded Again, is worded differently from the times it was asked earlier in the session.
- A prerequisite pulled in (spec 004) and a topic review's cards are rephrased like any other.
- After a rewrite (`card edit`), rephrasings start from the new stored question.
- The answer and the key points are never rephrased: the full answer shown after the grade is the stored one.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Every review recorded from this slice on MUST carry the question as asked, not blank; the CLI rejects a grade without it and records nothing. Reviews recorded before keep none.
- **FR-002**: A review MAY carry the flag `badly-rephrased`, and still at most one flag (spec 004 FR-001). A review flagged `badly-rephrased` is voided exactly as one flagged `badly-written` (spec 004 FR-002), with any grade: it leaves the card's schedule unchanged, the card is left out of every list until the next local day, and it counts toward its session's cap and never toward the day's new cards.
- **FR-003**: The review skill MUST rephrase the question on every review. The rephrasing keeps what the stored question asks for (its key points), names the technology and the variant, keeps code and commands verbatim, and gives no hint the stored question does not give. It differs from the stored wording and from wordings asked earlier in the session.
- **FR-004**: The grade MUST be checked against the stored key points, never against the rephrased wording; the answer shown after the grade is the stored one.
- **FR-005**: When the wording decided the answer, right or wrong, the review skill MUST tell which wording did. If only its rephrasing did, it records `badly-rephrased` and proposes no rewrite. If the stored wording would have decided it too, it records `badly-written` and proposes a rewrite (spec 004 FR-006). It says why in a line, and Angelo MAY dispute the flag or ask for one.
- **FR-006**: The effects of `badly-rephrased` on scheduling, on the lists and on both caps MUST be computed by the CLI and covered by its tests; the skill only says which flag applies (constitution II).

### Key Entities

- **Question as asked**: the exact question Claude asked in a review, the last wording before Angelo answered, kept with that review as one text; the card's stored question stays as it is.
- **Review flag**: gains `badly-rephrased`, a voided review caused by Claude's rephrasing, told apart from `badly-written`, a voided review caused by the stored card.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, a card Angelo has reviewed before comes back in `prod` worded differently, without his asking, and is graded against its stored key points.
- **SC-002**: In the first two weeks, at most 1 review in 20 is voided as `badly-rephrased`.
- **SC-003**: Every review recorded after the release carries the question as asked.
- **SC-004**: No review voided as `badly-rephrased` ever changes when a card comes back.

## Assumptions

- Rephrasing happens in the skill, every review, from the stored question; no variants are stored (design §8.2 step 16 rejected three stored variants per card).
- The CLI keeps the question as asked and does not check that it differs from the stored one: that is judgment.
- Claude does not see the wordings asked in earlier sessions; variety across sessions comes from rephrasing anew each time.
- `badly-rephrased` has the same effects as `badly-written` on scheduling, lists and caps. The two differ in that no rewrite is proposed, and in how stats (slice 6) and prune (slice 7) read them; this slice only records the flag.
- Reviews from before the slice are not backfilled with a question as asked.
- Command names, output fields and how the question as asked is stored are left to the plan.
