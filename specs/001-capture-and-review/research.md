# Research: Capture and Review

Facts were tried in scratch projects on Node 26.13.0 (SQLite 3.54.0), never in the repo or the
installed `aletheia`. Decisions marked **Angelo** were his, taken with options on the table.

## R2. Schema: three tables

- **Decision**: `cards`, `card_tags` and `reviews` ([data-model.md](./data-model.md)). Tags in
  their own table; key points as a JSON array on the card; FSRS state in plain columns;
  instants as UTC ISO text; `status` on the card from now.
- **Rationale**: slice 3 filters by tag and slice 5 groups by tag, which a table answers with
  an index and a `GROUP BY`, and its primary key makes a card's tags unique for free. Key
  points are always read with their card and never queried alone; `json_array_length` checks
  the count. The due list filters on `due` and `state`, and later stats read stability and
  lapses, so columns beat a blob. ISO text is readable in a backup and sorts as time. The
  design's domain lists `status`; slice 6 adds the archive reason with `ADD COLUMN`, no rebuild.
- **Alternatives**: tags as a JSON array (no index, uniqueness and the character check need
  code); key points in a table (three joins for a list of three); FSRS state as one JSON column
  (the due list would parse every row); epoch milliseconds (opaque when reading a store by hand).
- **Reversibility**: each of these moves with one migration and loses nothing.

## R3. Card id (Angelo)

- **Decision**: a random 4-character code from Crockford's base 32 in lowercase
  (`0-9a-hjkmnp-tv-z`: no `i`, `l`, `o`, `u`), e.g. `k7m2`, the table's primary key. The shell
  draws each character with `randomInt` from `node:crypto`, behind an injected port so tests
  fix the ids; a collision retries with a new draw.
- **Rationale**: Angelo chose a code over a consecutive number. Four characters give 1,048,576
  ids; at 1,000 cards a draw collides once in a thousand, and the primary key catches it. The
  alphabet drops the letters that read as digits and the vowel that spells words.
- **Alternatives**: a consecutive integer (`#12`: shortest, offered and declined); `nanoid` (a
  dependency for four characters); a UUID (not quotable in chat).

## R4. What a review keeps (Angelo)

- **Decision**: besides card, final grade, instant, answer and rationale, a review keeps
  `claude_grade` and `state_before`. "Changed after a dispute" is no longer stored: it is
  `grade <> claude_grade`.
- **Rationale**: both exist only at review time. Claude's grade says in which direction
  disputes go (twelve Good → Easy out of fourteen means the skill is stingy with Easy); a flag
  only counts them, and Claude can no longer set it wrong. The state before tells a lapse (Again
  on a `review` card) from a first-day miss (Again on a `new` or `learning` card), which
  retention in slice 5 needs; replaying the log to rebuild it breaks the day the learning steps
  change, and they already changed once (spec Clarifications).
- **Alternatives**: the spec's boolean (loses the direction); the whole `ts-fsrs` review log
  (stability, difficulty and intervals before the review: no stat in the design reads them).
- **Spec and design**: the Review entity, FR-005, 001-US2-AS2 and design §5 now name both.

## R5. Rules the store enforces

- **Decision**: `CHECK` constraints declared in the Drizzle schema, foreign keys, the tag
  primary key, and three triggers for INV-02 in a custom migration
  (`drizzle-kit generate --custom`).
- **Rationale**: Constitution III rejects corruption at write time, by `CHECK` where SQL can
  express the rule. Tried: `drizzle-kit` 1.0.0-rc.5 emits the `check()` constraints and the
  `<timestamp>_<name>/migration.sql` layout ADR-0002 expects, with a `snapshot.json` beside
  it that the migrator ignores; `node:sqlite` has foreign keys on by default; a
  `BEFORE DELETE`/`BEFORE UPDATE` trigger with `RAISE(ABORT, …)` refuses the statement and a
  trigger body survives the `--> statement-breakpoint` split. The refusals are listed in
  data-model.md.
- **Alternatives**: validation in the CLI only (a bug in a later command could write what the
  rule forbids); revoking deletes by convention (nothing to revoke in SQLite).

## R8. CLI commands (Angelo: grouped names)

- **Decision**: four commands in two groups: `aletheia card add`, `aletheia card show <id>`,
  `aletheia review due` and `aletheia review grade`. `card add` and `review grade` read JSON on
  stdin, validated with zod; `review grade` takes the card id, both grades, the answer and the
  rationale in one object. Output is TOON by default and JSON with `--json`, as `backup`.
- **Rationale**: Angelo chose groups over four loose verbs, so `archive`, `restore`, `stats`
  and `prune` find their place later. Stdin through a quoted heredoc (`<<'JSON'`) passes
  backticks, accents and multi-line code untouched; as an argument, quotes in the content break
  the shell. One object per grade means one schema and an error that names the field.
- **Alternatives**: `add`, `show`, `due`, `grade` (offered, declined); JSON as an argument
  (the design allowed it); flags for the grades and stdin for the text (two inputs to validate).
