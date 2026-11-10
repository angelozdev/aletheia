# Research: Intake Filter

Facts were tried in scratch on Node 26.13.0 (SQLite 3.54.0), never in the repo or the installed
`aletheia`. Decisions marked **Angelo** were his; the rest wait for his review with the ADRs.

## R1. Word search: an FTS5 table filled by a trigger

- **Decision**: a regular FTS5 table `card_search(card_id UNINDEXED, question, answer,
  key_points, situation)` with `tokenize = 'unicode61 remove_diacritics 2'`, filled by an
  `AFTER INSERT ON cards` trigger and backfilled by the same migration from the cards already
  stored. A custom migration (`drizzle-kit generate --custom`), since Drizzle cannot express a
  virtual table (constitution, Technology Constraints). Matches are ordered by FTS5's `rank`
  (bm25). Recorded in ADR-0014.
- **Rationale**: design §9 chose FTS5. The tokenizer folds case and accents in the index and
  the query alike, and `"consumidor"*` matched `consumidores` in scratch. The trigger makes a
  card searchable inside the transaction that saves it, and the backfill finds the cards saved
  before the release (002-US1-AS6), with no rebuild step (FR-002). A regular table keeps its
  own copy of the text (a few KB per hundred cards), so nothing can drift from `cards`.
- **Alternatives**: an external-content table (no copy, but it needs `'rebuild'` and exact
  sync, and a mistake returns wrong rows silently); the `trigram` tokenizer (substring matches,
  but `consumidores` still misses `consumidor`, terms under three letters such as `ps` never
  match, and the index triples); scoring in `src/core` over every active card (no schema, but
  hand-rolled relevance where SQLite ships bm25, against design §9).
- **Not now**: an update trigger. No command changes a card's text until slice 4 (rewrite),
  which adds the trigger with its test.

## R2. Search terms are built in the core

- **Decision**: `src/core/similar` turns the words into terms. It folds accents (NFD, drop
  combining marks) and case, splits on anything but `a`–`z` and digits, drops one-character
  words and common words (R3), makes plurals singular, and drops repeated terms. The adapter
  writes each term as a quoted prefix, `"consumidor"*`, joined by `OR`. Singular rule: a word
  of five letters or more ending in `es` loses `es` (`consumidores` → `consumidor`), else a
  word of four or more ending in `s` loses `s` (`mensajes` → `mensaje`, `redis` → `redi`). The
  prefix match then covers both forms.
- **Rationale**: a term holds only `a`–`z` and digits, so no character the user sends reaches
  FTS5's query syntax (FR-003, 002-US1-AS4): in scratch, `¿Qué es "esto" (y \`*\` -a : NOT)?`
  became the plain terms `esto` and `not`. Which words count is a rule, so it is code with unit
  tests (constitution II); only the quoting is SQL.
- **Alternatives**: a Snowball Spanish stemmer (stemming the index needs a custom FTS5
  tokenizer, which `node:sqlite` cannot register, and the spec asks only for singular and
  plural); passing the text to `MATCH` as is (quotes, `*`, `-`, `:`, `NOT` are operators there).
- **Known limit**: prefix noise (`bases` → `bas*` also matches `bash`). The candidates are
  ranked and Claude judges them, so a stray candidate costs one line of reading.

## R3. Common words: a list in the core

- **Decision**: a constant in `src/core/similar` with about a hundred Spanish and English
  grammatical words (articles, prepositions, pronouns, `ser`/`estar`/`haber` forms, question
  words: `el`, `de`, `qué`, `cómo`, `hay`, `entre`, `es`, `the`, `of`, `is`), plus the words
  that frame card questions in design §7 (`diferencia`, `pasa`, `hace`, `sirve`), which would
  otherwise match every comparison and scenario card.
- **Rationale**: 002-US1-AS1 needs a card sharing only such words to stay out. A list is data,
  not logic, and a library list did not fit: `stopword` 3.1.5 (maintained) has 60 Spanish words
  and lacks `es`, `hay`, `entre`, `cómo` and `este`; `stopwords-iso` has had no release since
  2022 (constitution VI rules out unmaintained packages).
- **Alternatives**: no list, relying on bm25 to sink common words (they still match, so card D
  would be listed); dropping words found in most cards (unstable on a small deck, and it would
  drop `docker` from a Docker-heavy deck).

## R4. Tags and the order: the core over the active cards

- **Decision**: the core asks the repository for the word matches in relevance order (one new
  port method, `CardRepository.matching(terms)`) and for the active cards it already returns
  (`active()`, used by the due list), keeps those whose tags share a family with the search
  (`sharesTagFamily`: the same tag, an ancestor or a descendant), and orders: word matches
  sharing a family, word matches that do not, then the rest of the family, by creation date,
  newest first. It returns the first 10 (`SIMILAR_CARDS_LIMIT`).
- **Rationale**: the tag hierarchy is deterministic logic and the constitution names it among
  the core's (II); slice 3 (topic review by tag and descendants) reuses it. Reading every
  active card for the tags costs milliseconds on 1,000 cards (SC-004) and adds no SQL.
- **Alternatives**: the family as a `GLOB` in SQL (the hierarchy would live in the adapter);
  one SQL query that ranks everything (all the ordering out of the core's tests).

## R5. The command: `aletheia card search`, JSON on stdin

- **Decision**: `aletheia card search` reads `{ "words": "…", "tags": ["…"] }` from stdin
  through a quoted heredoc, both fields optional but not both missing, and prints `cards[n]`
  with `id`, `type`, `tags`, `question`, `answer`, the same shape as `review due` without key
  points ([contracts/cli.md](./contracts/cli.md)). Tags are validated by the grammar of
  `card add` and its message.
- **Rationale**: the words carry the draft's question and answer, with backticks, quotes and
  code; the quoted heredoc is how the skills already pass such text untouched. A read command
  taking JSON is new, but the shell would break the same text passed as an argument.
- **Alternatives**: `--words '…'` and `--tag` options (a `'` inside a snippet ends the
  argument); several searches in one call (nested output for a capture of one to three drafts,
  which Claude can run in parallel anyway).

## R6. The profile: an untracked file read in place (Angelo)

- **Decision**: `PROFILE.md` at the repo root, `/PROFILE.md` in `.gitignore`. `az-aletheia-add`
  reads it at `~/me/aletheia/PROFILE.md` from any repo; the review skill reads it from the repo.
  Both edit it in place after Angelo approves the exact line. Spanish Markdown, one bullet per
  area: `- **Frontend**: muy fuerte; lo básico cuenta como ya sabido.` The first version comes
  from design §5, written by Claude and approved by Angelo during implementation. Recorded in
  ADR-0015.
- **Rationale**: Angelo chose it (spec, Clarifications) so that a change counts at once, from
  any repo, with no commit, merge or release. An ignored file is the same on every branch, so
  reading it in place never follows a checkout. One bullet per area gives Claude a line to
  change instead of a second line that contradicts the first.
- **Alternatives**: shipped with the release beside the skill (a change waits for a release);
  a table behind `aletheia profile` (a schema and an amendment for a short text). Both rejected
  by Angelo.
- **Cost**: no history and no backup. `git clean -fdx` deletes it; the skill then says so in
  one line and drafts without it.

## R7. Constitution 1.6.0 and design §5, §8.1 and §9

- **Decision**: amend the constitution (MINOR, a rule changes as in 1.5.0) and update the
  design before `/speckit-implement`, in their own commits:
  - Principle IV: the regression eval "reruns whenever the skill changes, against a frozen copy
    of the profile it was written with", replacing "whenever the skill or `PROFILE.md` changes".
  - Technology Constraints: `PROFILE.md` lives in `~/me/aletheia` "ignored by git: it is
    Angelo's, read and edited in place by the skills, only with his approval"; the global skill
    "reads the profile from the repo, the one thing it does not take from the release".
  - Development Workflow: "A prompt change reruns the evals of the affected skill", without
    `PROFILE.md`.
  - Design §5 (the profile is untracked, kept current from captures and reviews), §8.1 step 2
    (the search with synonyms and technical terms), §9 (R1 to R3).
- **Rationale**: a profile that changes in the middle of a review cannot rerun evals on every
  change, and an eval is only reproducible against the profile it was frozen with. The
  constitution says the design changes first, then the spec; the spec already moved during
  clarification, so the design catches up here.

## R8. How the skills show a flag

- **Decision**: a flagged draft carries its reason on the line after its header, in Spanish:
  `⚠ duplica a #k7m2` or `⚠ se solapa con #k7m2: <qué repite>; agrega <qué es nuevo>`, then
  `trivia`, `ya lo sabes por tu perfil`, `sin situación creíble`, each with a short reason. A
  profile offer is the last line of Claude's reply: `¿Anoto en tu perfil: «<línea>»?`, or
  `¿Cambio en tu perfil «<antes>» por «<después>»?`.
- **Rationale**: Angelo reads one block per draft; a reason after the flag lets him decide
  without asking. The offer at the end of the reply never interrupts the question or the grade
  (spec, Clarifications).
