# Feature Specification: Intake Filter

**Feature Branch**: `002-intake-filter` | **Created**: 2026-11-09 | **Status**: Draft
**Input**: Slice 2 of `docs/design/2026-11-08-aletheia-design.md` §13: profile, quality rules, duplicate search, dubious flags (design §5 Profile, §6, §8.1 steps 1–3, §9 duplicate search). Angelo exercises it when Claude flags junk and duplicates while proposing cards with `az-aletheia-add`.

## Clarifications

### Session 2026-11-09

- Q: Where does the profile live, and how does the global skill read it from any repo? → A: `PROFILE.md` at the repo root, ignored by git: personal, never committed or pushed, the same on every branch. Both skills read and edit it in place at `~/me/aletheia/PROFILE.md`, so a change counts at once, from any repo. Shipping it with the release was rejected: a change would wait for a merge and a release. A store table behind the CLI was rejected: a schema and a constitution amendment for a text file. Cost: no history and no backup.
- Q: When does Claude offer to change the profile? → A: The moment Angelo states his level during a capture or a review, in one line at the end of Claude's next reply, without stopping the flow. Never saved for the end: a review rarely ends with "terminamos por hoy".
- Q: When does Claude listen for what Angelo says about his level? → A: Only while a capture or a review is running. In any other conversation, a work session in `diarium` included, and once a capture is over, nothing is offered; the add skill gets no new triggers.
- Q: Does a vector database or a model find the duplicates? → A: No (constitution VI, design §2). The CLI returns candidates by words and tags, and Claude judges them. Claude widens each search with synonyms and the technical terms of the draft, in Spanish and English, so a card worded differently still comes back. `sqlite-vec` (design §14) waits for a duplicate that slips through twice (constitution IV).

## User Scenarios & Testing _(mandatory)_

Judging a duplicate, an overlap, trivia, Angelo's level or what belongs in his profile is judgment (constitution II): the CLI returns candidates, never verdicts, and Angelo checks the judgment by using the slice; its evals arrive after a second real failure (constitution IV). The scenarios below cover the search, the profile's place and the skill files.

### User Story 1 - Duplicates flagged at capture (Priority: P1)

In any repo, Angelo says "guarda esto" about something the deck already holds. Before showing any draft, `az-aletheia-add` asks the CLI for the cards similar to each draft and shows one that repeats a card flagged `duplica a #k7m2`, or `se solapa con #k7m2: <qué repite>` when it repeats only part. Angelo still decides.
**Independent Test**: with `#k7m2` on `docker ps -a` in the deck, discuss `docker ps` in another repo, say "guarda esto", and see the draft flagged as a duplicate of `#k7m2`.

1. **002-US1-AS1** Given card A sharing words and a tag with a draft, card B sharing the same words but no tag, card C sharing only a tag's family (the same tag, an ancestor or a descendant) and card D sharing neither (common words such as «qué» or «en» aside), When similar cards are searched with the draft's words and tags, Then stdout lists A, B and C in that order, each with id, type, tags, question and answer, and D is absent.
2. **002-US1-AS2** Given a card that differs from the search words only in case, accents or a word's singular or plural ("Consumidor" / "consumidores", "configuración" / "configuracion"), When searched, Then it is found.
3. **002-US1-AS3** Given more than 10 similar cards, When searched, Then only the 10 most similar are listed.
4. **002-US1-AS4** Given search words holding quotes, backticks, `*`, `-`, `:`, parentheses or a code snippet, When searched, Then every character is taken as plain text and the search answers like any other.
5. **002-US1-AS5** Given no similar card, When searched, Then the list is empty and the command succeeds; given neither words nor tags, or a malformed tag, it exits 1 naming the problem.
6. **002-US1-AS6** Given cards saved before this slice is released, When the store is migrated, Then search finds them; a card saved afterwards is found as soon as it is saved.
7. **002-US1-AS7** Given the `az-aletheia-add` skill file, When it is read, Then it asks the installed `aletheia` for the cards similar to every draft, with synonyms and technical terms added, before showing any draft, and flags a draft that repeats one with `duplica a #<id>` or `se solapa con #<id>`.

### User Story 2 - Junk flagged by profile and quality rules (Priority: P2)

Angelo's `PROFILE.md` says what he knows (very strong frontend, working backend, studying AWS). `az-aletheia-add` reads it before drafting. A draft about a frontend basic is shown flagged `ya lo sabes por tu perfil`; one about a date or a version, `trivia`; one whose situation is a stretch, `sin situación creíble`. Flagged drafts are shown with the rest, never dropped silently, and Angelo approves or rejects them like any other.
**Independent Test**: in another repo, discuss what `useState` returns and in which year Docker came out, say "guarda esto", and see both drafts flagged with their reasons.

1. **002-US2-AS1** Given the `az-aletheia-add` skill file, When it is read, Then it reads `~/me/aletheia/PROFILE.md` before drafting and flags a dubious draft with its reason: `trivia`, `ya lo sabes por tu perfil` or `sin situación creíble`.
2. **002-US2-AS2** Given the repo, When `PROFILE.md` is created or changed at its root, Then git ignores it.

### User Story 3 - Profile kept current from the conversation (Priority: P3)

During a review Angelo says "en el trabajo uso Terraform a diario", or during a capture he rejects a draft with "eso ya lo sé". Claude ends its next reply with one line, "¿Anoto en tu perfil: «Terraform: uso diario»?", and carries on. If Angelo says yes, Claude writes that line in `PROFILE.md`, and the next draft sees it; if he ignores it, the offer is dropped, not repeated.
**Independent Test**: in a review, mention you use Terraform daily and accept the offer; then, in another repo, discuss a Terraform basic, say "guarda esto", and see it flagged `ya lo sabes por tu perfil`.

1. **002-US3-AS1** Given the `az-aletheia-add` and review skill files, When they are read, Then each offers, only while it runs, a profile change the moment Angelo states his level, showing the exact line to add or change, and edits `~/me/aletheia/PROFILE.md` only after he approves.

### Edge Cases

- Two drafts of the same batch repeat each other: Claude merges them or drops one before showing them.
- A draft breaking a shape rule (one idea, an answer of 1–3 lines, a question that stands alone) is fixed by Claude before it is shown. Flags are for the worth rules: credible situation, not trivia, not already known, no duplicate.
- A flagged draft Angelo approves is saved like any other card; the flag is not stored.
- A draft that overlaps a card but adds something is flagged `se solapa con #<id>`, naming what is new; replacing or merging the old card waits for slice 6.
- Angelo states something that contradicts a profile line ("ya domino Lambda" against "estudiando AWS"): Claude offers to change that line, not to add a second one.
- Only explicit statements about his level count; a grade, an Easy streak or Claude's guess never changes the profile (that is prune's evidence, slice 6).
- The profile is missing (a fresh clone, `git clean -fdx`): the skill says so in one line and drafts without it, flagging nothing as `ya lo sabes por tu perfil`.
- An empty deck: every search is empty and no draft is flagged as a duplicate.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The CLI MUST search the active cards for those similar to some words, to tags, or both. Words are compared across question, answer, key points and situation, ignoring case and accents and accepting singular for plural; common words (articles, prepositions, question words: «el», «de», «qué», «the») never count as shared. A tag matches the same tag, its ancestors and its descendants. Cards sharing words come first, most similar first, those also sharing a tag family ahead of those that do not; then cards sharing only a tag family. At most 10, each with id, type, tags, question and answer.
- **FR-002**: The search MUST see every card the moment it is saved, those saved before this slice included, with no rebuild step for Angelo to run.
- **FR-003**: The search words MUST be taken literally: no character in them changes the query or makes the command fail.
- **FR-004**: `PROFILE.md` MUST live at the repo root, ignored by git, in Spanish: Angelo's level by area and what counts as already known (frontend basics do), as context for judging usefulness, not a whitelist of topics. The skills read and edit it in place at `~/me/aletheia/PROFILE.md`.
- **FR-005**: `az-aletheia-add` MUST read the profile before drafting, search the similar cards of every draft with synonyms and technical terms added before showing any, flag each dubious draft with its reason (`duplica a #<id>`, `se solapa con #<id>`, `trivia`, `ya lo sabes por tu perfil`, `sin situación creíble`), show flagged drafts next to the rest, and save only what Angelo approves (001 FR-006 still holds).
- **FR-006**: While a capture or a review runs, and only then, `az-aletheia-add` and the review skill MUST offer a profile change the moment Angelo states his level, in one line at the end of the next reply that does not stop the flow, showing the exact line to add or change; they write it only after he approves and drop an ignored offer without repeating it.
- **FR-007**: Every question about existing cards while drafting MUST be answered by running `aletheia`, never from memory or from earlier in the session (constitution VIII).

### Key Entities

- **Profile**: Angelo's level by area and what counts as already known, in Spanish, in an untracked file; read and edited, with his approval, by the add and review skills now and read by prune in slice 6.
- **Similar card**: a search result: id, type, tags, question, answer. A candidate for Claude to judge, never a verdict.
- **Flag**: the reason a draft is dubious, shown with the draft; not stored.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The day the slice is released, Angelo sees in `prod`, from another repo, a draft flagged as a duplicate of an existing card and one flagged by his profile or as trivia.
- **SC-002**: Of the drafts Angelo rejects in the first two weeks as a duplicate, already known or trivia, at least 9 in 10 had been flagged with that reason.
- **SC-003**: From "guarda esto" to saved cards still takes under 2 minutes of conversation (001 SC-002), with a search for every draft.
- **SC-004**: A search answers in under 1 second on a deck of 1,000 cards.
- **SC-005**: A profile change Angelo approves shapes the very next draft, in any repo, with no commit, merge or release.

## Assumptions

- The search is lexical, by words and tags, not semantic: a duplicate with no word, synonym or tag family in common can slip through.
- The profile has no history and no backup; losing it costs Angelo rewriting a few lines. The initial one is design §5's, written in Spanish by Claude and approved by Angelo; its guessed line ("heading toward full-stack with weight on cloud") stays only if he confirms it.
- The global skill reaching into the repo by an absolute path, and the profile becoming personal and untracked, touch ADR-0011, design §5 and the constitution ("A prompt or `PROFILE.md` change reruns the evals": evals will use a frozen fixture profile instead). The plan proposes the ADR and the amendment.
- Rejected drafts and flags leave no trace (design §8.1). Every card is active in this slice; archived cards (slice 6) are left out of the search.
- Out of scope, by slice: tag filtering, topic review and caps (3); prerequisite cards and badly-written flags (4); stats (5); prune reading the profile, replace and merge (6).
- The command name, its options and output layout, the limit's name and how word forms are matched are left to the plan.
