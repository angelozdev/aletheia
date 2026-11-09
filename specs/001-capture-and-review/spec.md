# Feature Specification: Capture and Review

**Feature Branch**: `001-capture-and-review` | **Created**: 2026-11-09 | **Status**: Draft
**Input**: Slice 1 of `docs/design/2026-11-08-aletheia-design.md` §13: `az-aletheia-add` proposes cards, Angelo approves; review asks, Claude grades, FSRS schedules. Angelo exercises it by adding a card from another repo and reviewing it in the Aletheia repo.

## User Scenarios & Testing _(mandatory)_

Drafting a card and grading an answer are judgment (constitution II): Angelo checks them by using the slice, and their evals arrive after a second real failure (constitution IV). The scenarios below cover what a test can check: the CLI the skills call and the skill files themselves.

### User Story 1 - Capture a card from any repo (Priority: P1)

In a Claude Code session in any repo, Angelo says "guarda esto". `az-aletheia-add` drafts cards from the conversation, following the five card types, and shows each one: type, tags, question, answer, key points, situation. Angelo approves, edits or rejects each draft; only the approved ones are saved, in `prod`.
**Independent Test**: in another repo, after discussing a topic, say "guarda esto", approve one draft, then ask Claude to show that card.

1. **001-US1-AS1** Given an approved card with a type, question, answer, 1–3 key points, a situation, one or more tags and a source, When it is saved, Then it is stored active and new, due now, and stdout gives its short id.
2. **001-US1-AS2** Given a card without a situation, with no key points or more than 3, with an unknown type or a malformed tag, When it is saved, Then it exits 1 naming the card and each invalid field, and nothing is stored.
3. **001-US1-AS3** Given several approved cards saved together, When one of them is invalid, Then none is stored.
4. **001-US1-AS4** Given content with Spanish accents, backticks and multi-line code, When the card is saved and then shown, Then every field reads back exactly as written.
5. **001-US1-AS5** Given a card id, When the card is shown, Then stdout gives every field and its next due instant; an unknown id exits 1 naming it.
6. **001-US1-AS6** Given the `az-aletheia-add` skill file, When it is read, Then its description carries its Spanish triggers ("guarda esto", "haz una tarjeta", "añade esto a aletheia") and it calls the installed `aletheia`, never `pnpm aletheia`, `--env` or a store path.

### User Story 2 - Review what is due (Priority: P1)

In the Aletheia repo, Angelo says "repasemos". The review skill shows one question at a time; Angelo answers in his own words; Claude grades Again, Hard, Good or Easy against the key points, says why, then shows the full answer. Angelo may dispute the grade, and his final one is recorded. FSRS decides when the card comes back.
**Independent Test**: with a card captured in US1, say "repasemos" in the Aletheia repo, answer, accept or dispute the grade, then ask when the card is due again.

1. **001-US2-AS1** Given new cards, studied cards due today and cards due later, When the due list is asked, Then it holds the new and due cards, studied ones first, each with id, type, tags, question, key points and answer, and their count.
2. **001-US2-AS2** Given a due card, When a grade is recorded with Angelo's answer, Claude's rationale and whether a dispute changed the grade, Then the review is logged with its instant and stdout gives the card's next due instant.
3. **001-US2-AS3** Given four copies of a card in the same state, When each is graded differently, Then Again comes back first and Easy last.
4. **001-US2-AS4** Given a card just graded Again and nothing else due, When the due list is asked again, Then the card is in it while its short relearning step ends within 20 minutes.
5. **001-US2-AS5** Given nothing due, When the due list is asked, Then it is empty and names when the next card is due.
6. **001-US2-AS6** Given an unknown card id, a grade outside the four, or a missing answer or rationale, When a review is recorded, Then it exits 1 naming the problem, and neither the log nor the card's schedule changes.
7. **001-US2-AS7** Given the review skill file, When it is read, Then its description carries its Spanish triggers ("repasemos", "vamos a repasar", "¿qué tengo para hoy?").

### Edge Cases

- A card graded before it is due is an early review: it is recorded, and FSRS grows its interval only a little.
- Malformed JSON input exits 1 before anything is stored.
- Tags are lowercase letters, digits and dashes in segments joined by `::` (`mensajeria::redis-streams`); a card's tags are unique.
- **INV-02** No card and no recorded review is ever deleted or rewritten by a command, and the store refuses deleting either.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: A card MUST have a type (concept, comparison, command, scenario, code), a question, an answer, a situation and a source, all non-empty, 1–3 non-empty key points and at least one tag; anything else is refused at write time and nothing is stored.
- **FR-002**: Every card MUST get a short, stable, unique id that Angelo can quote in chat.
- **FR-003**: A saved card MUST start active and new, due at once.
- **FR-004**: The due list MUST hold new cards, studied cards whose due date is on or before Angelo's local today, and (re)learning cards whose instant has passed or, when nothing else is due, ends within 20 minutes.
- **FR-005**: Recording a grade MUST append a review (card, grade, instant, Angelo's answer, Claude's rationale, changed-after-dispute) and reschedule the card with FSRS, short-term steps on.
- **FR-006**: `az-aletheia-add` MUST show every draft before saving, save only what Angelo approves (with his edits), store nothing he rejects, and write to `prod` through the installed `aletheia`.
- **FR-007**: The review skill MUST ask the CLI for the due list, show one question at a time without its answer or key points, grade by the rules of design §8.2, show the grade, the reason and the full answer, record Angelo's final grade, and go on until nothing is due or Angelo stops.
- **FR-008**: Every question about a card or what is due MUST be answered by running `aletheia` (constitution VIII).
- **FR-009**: `az-aletheia-add` MUST be available in Claude Code from any repo by [NEEDS CLARIFICATION: how does the global skill reach `~/.claude/skills/` so it matches the installed CLI — a link to the repo's working copy, installed by `pnpm release`, or a link to the released package's copy?].

### Key Entities

- **Card**: id, type, question, answer, key points, situation, tags, source, status (active in this slice), FSRS scheduling state, created and updated instants.
- **Review**: one per recorded grade: card, grade, instant, Angelo's answer, Claude's rationale, whether a dispute changed the grade.
- **Grade**: Again, Hard, Good or Easy.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo captures at least one card from another repo and reviews it in the Aletheia repo, in `prod`, without typing a command or a `/`.
- **SC-002**: From "guarda esto" to a saved card takes under 2 minutes of conversation.
- **SC-003**: Each CLI call of this slice answers in under 1 second on a deck of 1,000 cards.
- **SC-004**: A review of 10 due cards needs no input from Angelo beyond his answers and any disputes.

## Assumptions

- FSRS runs with its default parameters and a desired retention of 0.9; no optimizer.
- "Today" is Angelo's local calendar day, ending at midnight. Instants are stored in UTC.
- The 20-minute window is Anki's learn-ahead default; it is what lets a failed card come back within the session.
- The add skill fills the source with the current repo's name or the study context.
- No card can be edited or archived in this slice; a wrong card waits for slice 4 (rewrite) or 6 (archive).
- Out of scope, by slice: profile, quality rules, duplicate search, dubious flags (2); tag filtering, topic review, session and new-card caps (3); missing-prerequisite and badly-written flags, voided reviews (4); stats (5); prune, archive, restore (6).
- The card id format, the command names and their fields are left to the plan.
