# Feature Specification: Prune

**Feature Branch**: `007-prune` | **Created**: 2026-11-15 | **Status**: Draft
**Input**: Slice 7 of `docs/design/2026-11-08-aletheia-design.md` §13: prune. Candidates with their reason (mastered, no current situation, leech, overlapping, said to be useless through a `not-useful` review flag), archive with a required reason, restore, a keep that holds until new evidence (design §8.4), through a new local prune skill, and the count of the candidates the CLI finds in progress (§8.3). Angelo exercises it by running the prune skill.

## Clarifications

### Session 2026-11-15

- Q: Do replace, split and merge belong in this slice? → A: No: they are slice 8, and design §13 is renumbered. Until then an overlapping card is archived ("solapada con #9p3x") or rewritten in place. Everything in slice 7 (about twice slice 6, against constitution V's one to two days) and a split by who detects (slice 7 with only leech, mastered and not useful, which would list almost nothing before late January 2027) were rejected.
- Q: Are the thresholds settings now? → A: Yes: the mastered stability, the leech failures and the keep's months are settings in this slice, beside the session and new-card limits (ADR-0016). Constants until Angelo wants to change one was rejected.

## User Scenarios & Testing _(mandatory)_

Leech, mastered and not-useful candidates, archive, restore and keep are facts the CLI computes and records (constitution II). Whether a situation still applies to the profile, whether two cards ask the same thing, and what Angelo chooses are judgment. Prune never acts on its own: nothing is archived or kept without his choice.

### User Story 1 - Archive what no longer helps, and get it back (Priority: P1)

Angelo says "podemos el mazo". Claude lists the candidates the CLI finds, each with its reason and evidence: #k7m2 is a leech, 5 failures, the last on 2026-11-20; #r8tn is mastered, recall predicted beyond a year and its last two reviews Easy. For each he chooses archive, rewrite or keep. He archives #r8tn: "la respondo sin pensar". It leaves the reviews, the lists, progress and the search; `card show` still gives it, archived, with his reason. A week later, "devuélveme #r8tn": it is active again, with the schedule it had.
**Independent Test**: on a deck with a card failed 4 times and a mastered one, the candidates give both with their reasons; archiving one takes it out of every list and progress; restoring it brings it back with the same schedule.

1. **007-US1-AS1** Given active cards and their reviews, When the prune candidates are asked, Then a card with 4 or more counted failures is a leech (006 FR-002), and a card in review whose stability (days until predicted recall falls to 90%) reaches 365 and whose last two counted reviews were Easy is mastered; each candidate gives its id, stored question, tags, reasons and evidence (failures and the last one; stability and the last reviews).
2. **007-US1-AS2** Given an active card and a reason, When it is archived, Then it is archived with the reason and the instant, its schedule and reviews kept; it leaves the due list, topic review, card list, tag list, tag stats, the candidates and the search; `card show` gives it with its status, reason and instant, and its reviews stay in the review history. A blank reason, a card that does not exist or one already archived exits 1 naming the problem, and nothing changes.
3. **007-US1-AS3** Given an archived card, When it is restored, Then it is active with the schedule it had (overdue means due now) and back in every view; an active card or one that does not exist exits 1 naming it.
4. **007-US1-AS4** Given an archived card, When it is graded, edited or named as a prerequisite, Then it exits 1 naming it, and nothing is recorded.
5. **007-US1-AS5** Given candidates the CLI finds and not kept (US4), When the progress tree is asked, Then its total line gives how many cards they are.
6. **007-US1-AS6** Given the prune skill file, When it is read, Then its description carries the Spanish phrases that trigger it; it lists the candidates the installed `aletheia` gives, with reason and evidence, and offers per candidate archive, rewrite in place (004 US3, same knowledge only) or keep; it archives only after Angelo chooses, with the reason in his words, and restores a card he names; the stats skill mentions the count of AS5.

### User Story 2 - Said to be useless (Priority: P2)

Reviewing #q3rt, Angelo says "esto no me sirve, nunca lo uso". Claude grades his answer as usual and records the review as not useful, quoting him; the grade is real and schedules the card. At the next prune, #q3rt is a candidate, with his words and the day he said them.
**Independent Test**: grade a card with the flag `not-useful`; it is scheduled as without a flag, and the candidates give it with the review's rationale.

1. **007-US2-AS1** Given a card due, When it is graded with the flag `not-useful`, Then the review is logged with it and counts like an unflagged one: scheduling (001 FR-005), the caps, retention and failures.
2. **007-US2-AS2** Given a card with a `not-useful` review, When the candidates are asked, Then it is a candidate not useful, with the instant and rationale of its latest such review.
3. **007-US2-AS3** Given the review skill file, When it is read, Then when Angelo says a card adds nothing ("esto no me sirve", "esto lo sé de memoria"), it grades as usual, flags the review `not-useful` quoting his words in the rationale, tells him prune will list it, and archives nothing.

### User Story 3 - What Claude finds by reading (Priority: P2)

Claude also reads the deck, topic by topic: #m4cd's situation, "cuando prepare el examen de AWS", no longer fits `PROFILE.md`, which says he passed it; #9p3x and #w2ab ask nearly the same about acks in Redis Streams. Each comes with Claude's reason, said to be its judgment, and the same choices as US1.
**Independent Test**: on a tag with three cards, one query gives each with its question, key points and situation.

1. **007-US3-AS1** Given active cards under a tag, When they are asked for reading, Then one query gives each with its id, question, key points, situation and its keeps of the last six months (US4).
2. **007-US3-AS2** Given the prune skill file, When it is read, Then it reads `PROFILE.md` and each topic's cards through the installed `aletheia`; it proposes a card whose situation no longer applies, quoting both, and two cards asking nearly the same, quoting both questions and searching the deck (002) for overlaps across topics; it skips a card kept for that reason in the last six months, says each reason is its judgment, and offers the choices of 007-US1-AS6.

### User Story 4 - A kept card is not proposed again (Priority: P3)

Angelo keeps #k7m2: "falla porque es difícil, no porque esté mal escrita". The next prune does not list it as a leech; after it fails again, it does. The kept pair #9p3x and #w2ab is not proposed again for six months.
**Independent Test**: keep a leech; the candidates leave it out until a new counted failure is recorded.

1. **007-US4-AS1** Given an active card and a candidate reason, When it is kept, Then the keep is recorded with the card, the reason and the instant; an unknown reason, or a card that does not exist or is archived, exits 1 and nothing is recorded.
2. **007-US4-AS2** Given a kept candidate, When the candidates are asked, Then a kept leech is left out until a failure counted after the keep, a kept not-useful until a `not-useful` review after it, and a kept mastered for six months after it; the card's other reasons are not affected.
3. **007-US4-AS3** Given the prune skill file, When it is read, Then it records a keep only when Angelo chooses it, for the reason he was shown.

### User Story 5 - Tune the thresholds (Priority: P3)

"#k7m2 es difícil, no está mal escrita: pon el leech en 6 fallos". Claude sets it; the candidates and the weak cards of progress follow at once.
**Independent Test**: set the leech threshold to 6; a card with 5 failures is neither a candidate nor weak, and `default` brings back 4.

1. **007-US5-AS1** Given the mastered stability (365 days), the leech failures (4) and the keep's months (6), When one is set, Then the candidates and progress use it from the next query (the weak cards of 006 included); `default` brings back the built-in value, and `settings show` gives each with whether it is set. A value below 1 or not a whole number exits 1 naming it, and nothing changes.

### Edge Cases

- No candidate: Claude says so, and offers no judgment it did not find.
- A card that is a leech and not useful: one candidate with both reasons.
- An archived card restored keeps its failures and its keeps, and is a candidate again if they say so.
- A review already flagged (a gap, a voiding) keeps its flag, a review carrying one (ADR-0017): Angelo's words go in the rationale, and the card is not listed as not useful from it.
- Two overlapping cards before merge (slice 8): Angelo can archive one with "solapada con #9p3x" or keep both.
- A fix that changes what the key points mean: Claude says the card needs replacing, which arrives with slice 8, and offers keep or archive.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST give the candidates it can find on its own (leech, mastered, not useful), each with its reasons and evidence, leaving out the reasons kept (FR-004).
- **FR-002**: The CLI MUST archive an active card with a required reason and restore an archived one, keeping its schedule and reviews; an archived card MUST leave every list, the search and progress, and MUST NOT be graded, edited or named as a prerequisite. Nothing is deleted (INV-02).
- **FR-003**: A review MUST accept the flag `not-useful`, which counts like no flag everywhere and marks the card as a candidate.
- **FR-004**: The CLI MUST record a keep per card and reason, and leave a kept reason out until new evidence (007-US4-AS2) or, for the reasons it cannot see, give the keep to the skill.
- **FR-005**: The progress tree MUST give the count of FR-001's candidates.
- **FR-006**: A local prune skill MUST list the CLI's candidates and its own judgment ones, and archive, keep, restore or rewrite only on Angelo's choice, through the installed `aletheia`, in Spanish.
- **FR-007**: The mastered stability (365 days), the leech failures (4) and the keep's months (6) MUST be settings Angelo can change and reset to their built-in value, read by the candidates and by progress.

### Key Entities

- **Candidate**: an active card with one or more reasons to prune it, and the evidence for each.
- **Archive**: a card's retirement, with Angelo's reason and its instant; undone by a restore.
- **Keep**: Angelo's choice to keep a candidate for one reason, with its instant.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo runs prune in `prod` and decides on every candidate listed, without a command or a `/`.
- **SC-002**: In the first two weeks, no card is archived or kept without his choice, and every archived card shows his reason.
- **SC-003**: In the first two weeks, no kept card is proposed again for the same reason without new evidence.
- **SC-004**: The candidates answer in under 1 second on a deck of 1,000 cards and 20,000 reviews.

## Assumptions

- Mastered reads the card's stability: with FSRS-6, three Easy in a row reach it on day 74 (397 days), so the first mastered card in `prod` is due around late January 2027.
- A kept not-useful waits for a new `not-useful` review, not six months: his words are the evidence (refines design §8.4).
- Archive, restore and keep are recorded, never overwritten; the deck search keeps leaving archived cards out (002).
- Replace, split and merge, and a rewrite that changes what the key points mean, are slice 8. Progress's 30-day window stays a constant.
- Command names, flags, output fields and the store shape are left to the plan.
