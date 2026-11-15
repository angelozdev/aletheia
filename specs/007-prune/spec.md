# Feature Specification: Prune

**Feature Branch**: `007-prune` | **Created**: 2026-11-15 | **Status**: Draft
**Input**: Slice 7 of `docs/design/2026-11-08-aletheia-design.md` §13: prune. Candidates with their reason (mastered, no current situation, leech, overlapping, said to be useless through a `not-useful` review flag), archive with a required reason, restore, a keep that holds until new evidence (design §8.4), through a new local prune skill, and the count of the candidates the CLI finds in progress (§8.3). Angelo exercises it by running the prune skill.

## Clarifications

### Session 2026-11-15

- Q: Do replace, split and merge belong in this slice? → A: No: they are slice 8, and design §13 is renumbered. Until then an overlapping pair is kept, one of them archived ("solapada con #9p3x"), or left for the merge. Everything in slice 7 (about twice slice 6, against constitution V's one to two days) and a split by who detects (slice 7 with only leech, mastered and not useful, which would list almost nothing before late January 2027) were rejected.
- Q: Are the thresholds settings now? → A: Yes: the leech failures and the keep's months are settings in this slice, beside the session and new-card limits (ADR-0016). Constants until Angelo wants to change one was rejected.
- Q: Does prune work on a topic or always on the whole deck? → A: Either: the CLI's candidates come from the whole deck or from the topics Angelo names ("podemos mensajería"), as in progress; Claude's reading goes topic by topic, and after each it asks whether to go on. Always the whole deck (a reading that grows with the deck) and always one topic (a leech elsewhere waits until its topic is pruned) were rejected.
- Q: Does the duplicate search find archived cards? → A: Yes, marked archived with Angelo's reason, so a card he pruned does not come back unnoticed: when a draft matches one, `az-aletheia-add` quotes the reason and he chooses to drop the draft, save it, or restore the old card. Active cards only, as in slice 2, was rejected.
- Q: What does prune do with two overlapping cards before merge? → A: Angelo wants one card with the concept stated agnostically and examples in both technologies, which is a merge (slice 8). Until then Claude proposes no rewrite for an overlap: it offers to keep the pair, archive one, or leave it for the merge, which records nothing, so the pair comes back at the next prune. Rewriting one in place and archiving the other, and bringing merge into this slice, were rejected.
- Q: When does a card kept after a `not-useful` review come back as not useful? → A: Six months after the keep, as design §8.4 says, even if Angelo never says it again; a new `not-useful` review before then waits for the six months too. Only when he says it again after the keep, and whichever comes first, were rejected.
- Q: Is a mastered card a candidate? → A: No: Angelo does not mind reviewing a card once a year and does not want to forget it, so a card he recalls easily stays active, and FSRS spaces it a year or more (three Easy in a row: 397 days from day 74). Mastered leaves prune, with its stability threshold; design §8.4 is updated. Mastered as stability 365 and the last two counted reviews Easy, first chosen in this session, is dropped with it.
- Q: How many counted failures make a leech? → A: 3, the built-in value of the leech setting, so the weak cards of progress follow it too (it replaces 006's 4). The cost accepted, the one 006 named: failures count ever, so a card forgotten three times over a year is proposed though its wording is fine, and Angelo keeps it or raises the setting. Keeping 006's 4 was rejected.

## User Scenarios & Testing _(mandatory)_

Leech and not-useful candidates, archive, restore and keep are facts the CLI computes and records (constitution II). Whether a situation still applies to the profile, whether two cards ask the same thing, and what Angelo chooses are judgment. Prune never acts on its own: nothing is archived or kept without his choice.

### User Story 1 - Archive what no longer helps, and get it back (Priority: P1)

Angelo says "podemos el mazo". Claude lists the candidates the CLI finds, each with its reason and evidence: #k7m2 is a leech, 5 failures, the last on 2026-11-20; #q3rt is not useful, in his words of a week ago. For each he chooses archive, rewrite or keep. He archives #q3rt: "no lo uso desde que dejé ese proyecto". It leaves the reviews, the lists and progress; `card show` and the duplicate search still give it, archived, with his reason. A week later, "devuélveme #q3rt": it is active again, with the schedule it had.
**Independent Test**: on a deck with a card failed 3 times and one failed twice, the candidates give only the first, with its failures; archiving one takes it out of every list and progress; restoring it brings it back with the same schedule.

1. **007-US1-AS1** Given active cards and their reviews, When the prune candidates are asked, of the whole deck or under one or more tags (as in 006-US1-AS4), Then a card with 3 or more counted failures (006 FR-002, at the leech setting of US5) is a leech; each candidate gives its id, stored question, tags, reasons and evidence (for a leech, its failures and the last one).
2. **007-US1-AS2** Given an active card and a reason, When it is archived, Then it is archived with the reason and the instant, its schedule and reviews kept; it leaves the due list, topic review, card list, tag list, tag stats and the candidates; `card show` and the deck search give it with its status, reason and instant, and its reviews stay in the review history. A blank reason, a card that does not exist or one already archived exits 1 naming the problem, and nothing changes.
3. **007-US1-AS3** Given an archived card, When it is restored, Then it is active with the schedule it had (overdue means due now) and back in every view; an active card or one that does not exist exits 1 naming it.
4. **007-US1-AS4** Given an archived card, When it is graded, edited or named as a prerequisite, Then it exits 1 naming it, and nothing is recorded.
5. **007-US1-AS5** Given candidates the CLI finds and not kept (US4), When the progress tree is asked, Then its total line gives how many cards they are.
6. **007-US1-AS6** Given the prune skill file, When it is read, Then its description carries the Spanish phrases that trigger it; it lists the candidates the installed `aletheia` gives, with reason and evidence, and offers per candidate archive, rewrite in place (004 US3, same knowledge only) or keep; it archives only after Angelo chooses, with the reason in his words, and restores a card he names; the stats skill mentions the count of AS5.
7. **007-US1-AS7** Given the `az-aletheia-add` skill file, When it is read, Then when a draft matches an archived card, it says so, quoting the card and its reason, and offers to drop the draft, save it, or restore the archived card.

### User Story 2 - Said to be useless (Priority: P2)

Reviewing #q3rt, Angelo says "esto no me sirve, nunca lo uso". Claude grades his answer as usual and records the review as not useful, quoting him; the grade is real and schedules the card. At the next prune, #q3rt is a candidate, with his words and the day he said them.
**Independent Test**: grade a card with the flag `not-useful`; it is scheduled as without a flag, and the candidates give it with the review's rationale.

1. **007-US2-AS1** Given a card due, When it is graded with the flag `not-useful`, Then the review is logged with it and counts like an unflagged one: scheduling (001 FR-005), the caps, retention and failures.
2. **007-US2-AS2** Given a card with a `not-useful` review, When the candidates are asked, Then it is a candidate not useful, with the instant and rationale of its latest such review.
3. **007-US2-AS3** Given the review skill file, When it is read, Then when Angelo says a card adds nothing ("esto no me sirve", "esto lo sé de memoria"), it grades as usual, flags the review `not-useful` quoting his words in the rationale, tells him prune will list it, and archives nothing.

### User Story 3 - What Claude finds by reading (Priority: P2)

Claude also reads the deck, topic by topic: #m4cd's situation, "cuando prepare el examen de AWS", no longer fits `PROFILE.md`, which says he passed it; #9p3x and #w2ab ask nearly the same about acks, one in Redis Streams and one in RabbitMQ. Each comes with Claude's reason, said to be its judgment. Angelo would rather have one card with the agnostic concept and examples in both: that is a merge, in slice 8, so for now he keeps the pair, archives one, or leaves it for the merge.
**Independent Test**: on a tag with three cards, one query gives each with its question, key points and situation.

1. **007-US3-AS1** Given active cards under a tag, When they are asked with their content, Then one query gives each with its id, question, key points and situation, and the candidates give the keeps of the last six months (US4).
2. **007-US3-AS2** Given the prune skill file, When it is read, Then it reads `PROFILE.md` and the cards of the topic Angelo named, or of each topic in turn, through the installed `aletheia`, asking after each topic whether to go on; it proposes a card whose situation no longer applies, quoting both, and two cards asking nearly the same, quoting both questions and searching the deck (002) for overlaps across topics; it skips a card kept for that reason in the last six months and says each reason is its judgment; it offers the choices of 007-US1-AS6 for a situation, and for an overlap no rewrite: keep the pair, archive one, or leave it for the merge (slice 8), which records nothing.

### User Story 4 - A kept card is not proposed again (Priority: P3)

Angelo keeps #k7m2: "falla porque es difícil, no porque esté mal escrita". The next prune does not list it as a leech; after it fails again, it does. The kept pair #9p3x and #w2ab is not proposed again for six months.
**Independent Test**: keep a leech; the candidates leave it out until a new counted failure is recorded.

1. **007-US4-AS1** Given an active card and a candidate reason, When it is kept, Then the keep is recorded with the card, the reason, the instant and, for an overlap, the other card, so it covers only that pair; an unknown reason, or a card that does not exist or is archived, exits 1 and nothing is recorded.
2. **007-US4-AS2** Given a kept candidate, When the candidates are asked, Then a kept leech is left out until a failure counted after the keep, and a kept not-useful for six months after it; the card's other reasons are not affected.
3. **007-US4-AS3** Given the prune skill file, When it is read, Then it records a keep only when Angelo chooses it, for the reason he was shown.

### User Story 5 - Tune the thresholds (Priority: P3)

"#k7m2 es difícil, no está mal escrita: pon el leech en 6 fallos". Claude sets it; the candidates and the weak cards of progress follow at once.
**Independent Test**: set the leech threshold to 6; a card with 5 failures is neither a candidate nor weak, and `default` brings back 3.

1. **007-US5-AS1** Given the leech failures (3) and the keep's months (6), When one is set, Then the candidates and progress use it from the next query (the weak cards of 006 included); `default` brings back the built-in value, and `settings show` gives each with whether it is set. A value below 1 or not a whole number exits 1 naming it, and nothing changes.

### Edge Cases

- No candidate: Claude says so, and offers no judgment it did not find.
- A card that is a leech and not useful: one candidate with both reasons.
- An archived card restored keeps its failures and its keeps, and is a candidate again if they say so.
- A review already flagged (a gap, a voiding) keeps its flag, a review carrying one (ADR-0017): Angelo's words go in the rationale, and the card is not listed as not useful from it.
- Two overlapping cards before merge (slice 8): Angelo keeps the pair, archives one with "solapada con #9p3x", or leaves it; a pair left comes back at the next prune.
- A card kept as overlapping #w2ab that also overlaps a new capture #z1yk: the new pair is proposed.
- A fix that changes what the key points mean: Claude says the card needs replacing, which arrives with slice 8, and offers keep or archive.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST give the candidates it can find on its own (leech, not useful), of the whole deck or under the tags named, each with its reasons and evidence, leaving out the reasons kept (FR-004).
- **FR-002**: The CLI MUST archive an active card with a required reason and restore an archived one, keeping its schedule and reviews; an archived card MUST leave every list and progress, MUST be found by the deck search marked archived with its reason, and MUST NOT be graded, edited or named as a prerequisite. Nothing is deleted (INV-02). **INV-03** No archive, restore or keep is ever deleted or changed; the store refuses both.
- **FR-003**: A review MUST accept the flag `not-useful`, which counts like no flag everywhere and marks the card as a candidate.
- **FR-004**: The CLI MUST record a keep per card and reason, and leave a kept reason out until new evidence or the keep's months pass (007-US4-AS2) or, for the reasons it cannot see, give the keep to the skill.
- **FR-005**: The progress tree MUST give the count of FR-001's candidates.
- **FR-006**: A local prune skill MUST list the CLI's candidates and its own judgment ones, and archive, keep, restore or rewrite only on Angelo's choice, through the installed `aletheia`, in Spanish.
- **FR-007**: The leech failures (3) and the keep's months (6) MUST be settings Angelo can change and reset to their built-in value, read by the candidates and by progress.

### Key Entities

- **Candidate**: an active card with one or more reasons to prune it, and the evidence for each.
- **Archive**: a card's retirement, with Angelo's reason and its instant; undone by a restore.
- **Keep**: Angelo's choice to keep a candidate for one reason, with its instant and, for an overlap, the other card.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo runs prune in `prod` and decides on every candidate listed, without a command or a `/`.
- **SC-002**: In the first two weeks, no card is archived or kept without his choice, and every archived card shows his reason.
- **SC-003**: In the first two weeks, no kept card is proposed again for the same reason before new evidence or the end of its six months.
- **SC-004**: The candidates answer in under 1 second on a deck of 1,000 cards and 20,000 reviews.

## Assumptions

- Archive, restore and keep are recorded, never overwritten.
- `az-aletheia-add` reaches Claude only through a release, so AS7 is seen in `prod` after it.
- Replace, split and merge, and a rewrite that changes what the key points mean, are slice 8.
- A keep of an overlap covers only that pair: new captures are frequent, and a keep per card would hide a new duplicate for six months.
- Progress's 30-day window stays a constant.
- Command names, flags, output fields and the store shape are left to the plan.
