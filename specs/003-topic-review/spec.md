# Feature Specification: Topic Review

**Feature Branch**: `003-topic-review` | **Created**: 2026-11-10 | **Status**: Draft
**Input**: Slice 3 of `docs/design/2026-11-08-aletheia-design.md` §13: hierarchical tags, ahead-of-schedule review, caps (design §5 Tags, §8.2 steps 1, 2, 11–13). Angelo exercises it with "repasemos mensajería".

## Clarifications

### Session 2026-11-10

- Q: How does Angelo change the caps ("Default 10, configurable", design §8.2 step 13)? → A: For one session, in conversation: "hoy dame 20 nuevas", "hoy solo 10", "vamos a ver 25". Claude passes the number to the CLI for that session only; the next session is back to the defaults. A fixed limit was rejected because it contradicts the design.
- Q: How are new cards placed when reviews are behind (100 due, 50 new, sessions of 20)? → A: Each session keeps a share of its cards for new ones, 10% by default, rounded up so a session with new cards available shows at least one, spread through it (at 10%, the 10th and the 20th card). The share is a floor: with few reviews due, new cards fill the rest up to the daily limit, and the daily limit always wins. It applies to topic reviews too. "Reviews first, new cards only when nothing is due" was rejected: a backlog would hold every new card back for days.
- Q: Can Angelo keep a default instead of naming it every session? → A: Yes (US4): session size, new cards per day and new share are settings in the store, shown and changed through the CLI, changed only after Angelo approves the exact change. A limit named for one session wins over a setting, a setting over the built-in default. `PROFILE.md` was rejected (it describes his level, the CLI does not read it, it has no backup); a config file too (a second writer, outside the backup).
- Q: Do the settings and the one-session limits take JSON or flags? → A: Flags, under a `settings` group (`settings show`, `settings set --session-size 15`), with the same names as the one-session options of the due list (`--session-size 10`) and `default` to go back to the built-in value: they are numbers, with nothing to quote. Commands that take free text (`card add`, `card search`, `review grade`) keep JSON on stdin through a quoted heredoc: in a flag, a backtick or a `$` in a card would be run or expanded by the shell and corrupt it silently. Accepting both everywhere was rejected: two parsers per command that no skill would use.
- Q: Is a session stored? → A: No. The CLI prints the instant a session began on its first answer and Claude repeats it on every later call; the CLI counts the session's cards from the review log. Lost instant (a `/compact`): a new session begins and its count restarts, at most 20 more cards before asking. Going on at the cap works the same way: Claude asks again without the instant and a new round of up to 20 begins. A stored session waits in design §14 until that causes real trouble.

## User Scenarios & Testing _(mandatory)_

Mapping the topic Angelo names in Spanish to tags is judgment (constitution II): the CLI gives the tags in use and Claude picks. Which cards a review holds, in which order, and where a cap cuts are facts the CLI computes, never the skill.

### User Story 1 - Review a topic ahead of schedule (Priority: P1)

In the Aletheia repo Angelo says "repasemos mensajería". Claude asks the CLI for the tags in use, picks `messaging`, and reviews every active card under it, due or not: due cards first, then new ones, then the rest, soonest due first. Every grade is a real review; FSRS grows an early success's interval only a little.
**Independent Test**: with cards under `messaging::redis-streams` and `messaging::rabbitmq`, none due, and one under `docker`, say "repasemos mensajería" and review the messaging cards only.

1. **003-US1-AS1** Given active cards tagged `messaging::redis-streams`, `messaging::rabbitmq` and `docker::commands`, When the tags are listed, Then stdout gives every tag and each ancestor (`docker`, `docker::commands`, `messaging`, `messaging::rabbitmq`, `messaging::redis-streams`) with how many active cards it covers, descendants included; a card is counted once per tag even when two of its tags fall under it.
2. **003-US1-AS2** Given cards tagged `messaging`, `messaging::rabbitmq`, `messaging-legacy` and `docker`, When the topic `messaging` is asked, Then it holds the first two only; the topic `messaging::rabbitmq` holds only the second, because ancestors are not part of a topic.
3. **003-US1-AS3** Given a topic with a relearning card due, a review card due today, a new card and cards due in 3 and in 30 days, When the topic is asked, Then it lists them in that order, each with id, type, tags, question, key points and answer, and their count.
4. **003-US1-AS4** Given a topic card not due for 30 days, When it is graded, Then the review is logged like any other and its next due is computed from that instant (001 edge case: early review).
5. **003-US1-AS5** Given a topic card graded Good earlier today, When the topic is asked, Then it is absent; a card graded Again comes back when its step ends, as in 001-US2-AS4.
6. **003-US1-AS6** Given two tags from different branches, When asked as one topic, Then the list holds the cards under either, each once.
7. **003-US1-AS7** Given a malformed tag, or one that covers no active card, When the topic is asked, Then it exits 1 naming it; given a topic whose cards were all graded today, Then the list is empty and names when the topic's next card is due.
8. **003-US1-AS8** Given the review skill file, When it is read, Then for a named topic it lists the tags through the installed `aletheia`, picks the tags that cover the topic and reviews only those; when no tag covers it, it says so and names the top-level tags, never guessing one.

### User Story 2 - A session stops to ask after 20 cards (Priority: P2)

A session, general or by topic, shows at most 20 distinct cards. At the 20th Claude says how many remain and asks whether to go on; if Angelo says yes, up to 20 more. A card graded Again that comes back within the session does not count.
**Independent Test**: with 25 cards due, review 20, see Claude stop and say 5 remain; say "sigue" and finish them.

1. **003-US2-AS1** Given 25 cards due and a session just started, When the list is asked, Then it holds 20 and says 5 remain.
2. **003-US2-AS2** Given 20 cards graded in the session, one of them graded Again and due again, When the list is asked, Then it holds only that card and says the cap is reached with 5 remaining.
3. **003-US2-AS3** Given the cap reached and Angelo going on, When the list is asked, Then it holds the remaining 5, and at most 20 more in any case.
4. **003-US2-AS4** Given Angelo sets a session of 10, When the list is asked with 25 due, Then it holds 10 and says 15 remain; the next session holds 20 again.
5. **003-US2-AS5** Given the review skill file, When it is read, Then at the cap it says how many cards remain and asks whether to go on, goes on only if Angelo says so, and passes a session size he names ("hoy solo 10") to the CLI.

### User Story 3 - At most 10 new cards a day (Priority: P3)

After a capture of 15 cards, the next general review introduces 10 and says the other 5 wait for tomorrow. A topic review includes the topic's new cards without this cap. Even with 100 reviews due, each session keeps 10% of its cards for new ones, so learning never stops while Angelo catches up.
**Independent Test**: save 12 cards, say "repasemos", see 10 new among the cards and Claude saying 2 wait for tomorrow; then review the topic of the other 2 and see them.

1. **003-US3-AS1** Given 15 new cards and none introduced today, When the general list is asked, Then it holds the 10 saved first and says 5 new are held back until tomorrow.
2. **003-US3-AS2** Given 4 new cards first graded today, in any kind of review, When the general list is asked, Then it holds at most 6 new ones; on the next local day, up to 10 again.
3. **003-US3-AS3** Given 15 new cards under one tag, When that topic is asked, Then all 15 are eligible; only the session cap applies.
4. **003-US3-AS4** Given 30 new cards, 4 introduced today and Angelo asking for 20 new today, When the general list is asked with that limit, Then it holds at most 16 new ones; the next session without a limit is back to 10 a day.
5. **003-US3-AS5** Given 100 review cards due, 50 new ones, none introduced today and the default share, When a session of 20 is asked, Then it holds 18 review cards and 2 new ones, the 10th and the 20th.
6. **003-US3-AS6** Given reviews due and new cards available, When a session of 5 is asked with a share of 10%, Then it holds 1 new card; with a share of 0, none; with only 3 reviews due, new cards fill the session up to the daily limit; and the same holds in a topic review.

### User Story 4 - Defaults that stay (Priority: P4)

Angelo says "a partir de ahora quiero sesiones de 15 y 20 % de nuevas". Claude shows the exact change and, once he approves it, saves it through the CLI; every later review uses it until he changes it. A limit he names for one session ("hoy solo 10") still wins.
**Independent Test**: say "a partir de ahora sesiones de 15", approve it, then start a review with 25 cards due and see 15.

1. **003-US4-AS1** Given no saved settings, When the settings are shown, Then stdout gives session size 20, new cards per day 10 and new share 10%, each marked as the built-in default.
2. **003-US4-AS2** Given a saved session size of 15, When the list is asked without a size, Then it holds at most 15; asked with a size of 10 for the session, at most 10.
3. **003-US4-AS3** Given a session size below 1, new cards per day below 0 or a share outside 0–100%, When saved, Then it exits 1 naming each invalid setting and nothing changes.
4. **003-US4-AS4** Given the review skill file, When it is read, Then it tells a one-session limit ("hoy solo 10") from a lasting one ("a partir de ahora", "siempre"), shows the exact change, and saves a lasting one through the installed `aletheia` only after Angelo approves it.

### Edge Cases

- A card under two tags of the same topic is listed once and counted once for the session cap.
- A topic `messaging` never covers `messaging-legacy`: tags are compared by whole segments.
- A topic review today does not bring back a card already graded today in a general review, unless it is (re)learning and due.
- A card created from a doubt during a review (001 FR-007) is new like any capture and follows the daily cap; the exemptions for prerequisite and rewritten cards arrive with slices 4 and 6.
- Nothing due but new cards held back by the cap: the list is empty, says how many new cards wait, and names when the next card comes.
- Angelo stops at the cap: a card graded Again in the session stays (re)learning and comes up in the next review.
- A share of 10% in a session of 200 asks for 20 new cards; the daily limit of 10 wins.
- Angelo names a topic that spans two branches ("repasemos redis" → `messaging::redis-streams` and `databases::redis`): Claude reviews both tags as one topic.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST list the tags in use by active cards, each with its ancestors, sorted, and how many active cards each covers, descendants included.
- **FR-002**: The CLI MUST give a topic's cards for one or more tags: every active card under a tag or its descendants, compared by whole segments, each listed once, in this order: (re)learning cards due, review cards due today, new cards (saved first first), then review cards not due, soonest first. A card not due that was graded today is left out; (re)learning cards follow the rules of 001 FR-004.
- **FR-003**: A grade on a card that is not due MUST be recorded and scheduled like any other review (001 FR-005).
- **FR-004**: A session MUST show at most 20 distinct cards; a card shown again after its grade in the same session does not count. When the cap is reached, the list MUST say so and how many remain; going on allows up to 20 more. Angelo MAY set another size for one session or keep one as a setting (FR-009).
- **FR-005**: A general review MUST introduce at most 10 new cards per local day, counting every new card first graded that day in any review, and MUST say how many new cards it holds back. A topic review MUST include the topic's new cards without this cap. Each session MUST keep a share of its cards for new ones, 10% by default, rounded up and spread through the session; the share is a floor and never exceeds the daily limit, in general and topic reviews alike. Angelo MAY set another daily limit or share for one session or keep one as a setting (FR-009).
- **FR-006**: The selection, the order and both caps MUST be computed by the CLI and covered by its tests; the skill only relays them (constitution II).
- **FR-007**: The review skill MUST map a topic Angelo names to tags from the CLI's tag list, ask the CLI for that topic's cards, review them like due cards (001 FR-007), stop at the session cap to ask whether to go on, mention held-back new cards when the list holds them, pass a limit Angelo names for one session, and save a lasting one only after he approves the exact change.
- **FR-008**: Every question about tags, a topic, what is due or the settings MUST be answered by running `aletheia` (constitution VIII).
- **FR-009**: The store MUST hold Angelo's settings: session size (1 or more), new cards per day (0 or more) and new share (0 to 100%). The CLI MUST show them, marking those still at the built-in default, and change them, refusing an invalid value with nothing changed. A limit named for one session wins over a setting, a setting over the built-in default.

### Key Entities

- **Tag tree**: every tag in use and its ancestors, with the active cards each covers. Derived, not stored.
- **Topic**: one or more tags; covers the active cards under them and their descendants.
- **Session**: one review conversation, from Angelo's ask to his stop; the cards graded in it count toward its cap.
- **Introduced card**: a new card's first review; the day's count comes from the review log.
- **Settings**: Angelo's lasting defaults (session size, new cards per day, new share), one set per store; the built-in defaults until he changes one.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo says "repasemos <tema>" in `prod` and reviews that topic's cards, some not yet due, without typing a command or a `/`.
- **SC-002**: In the first two weeks, no session shows a 21st distinct card without asking Angelo first.
- **SC-003**: On a day Angelo saves more than 10 cards, the next general review introduces 10 new ones and says how many wait.
- **SC-004**: In at least 9 of 10 topic reviews in the first two weeks, Angelo does not correct the tags Claude picked.
- **SC-005**: The tag list and a topic's cards each answer in under 1 second on a deck of 1,000 cards.
- **SC-006**: After Angelo saves a default, no later session needs him to repeat it.

## Assumptions

- US4 needs a schema change; the others work on the built-in defaults without it, so US4 can move to its own slice if this one outgrows two days (constitution V).
- Every new card first graded today counts toward the day's limit, from a topic review too: the cap limits how many cards will come due in the days that follow, whatever introduced them.
- A topic review leaves out a card graded today because showing it again the same day only inflates its record; the 001 learn-ahead rule still brings back a card graded Again.
- One person, one store per environment: no user, no name and no card owner in the store (design §2). Settings belong to the store, so `prod` and `test` keep their own.
- Every card is active in this slice; archived cards (slice 6) leave every list.
- Out of scope, by slice: prerequisite cards, voided reviews and their cap exemptions (4); tag stats such as retention, due count or weak cards (5); prune, archive, rewrite, split and merge (6).
- Command names, options, output layout and the cap constants' names are left to the plan.
