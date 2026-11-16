# 0020. Skills checked by what code can check

- **Status:** accepted
- **Date:** 2026-11-16
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** —

## Context and problem statement

A skill scenario is written "Given the skill file, When it is read, Then…". Traceability
requires a test named by every scenario id, and constitution IV allows no eval before a skill's
second real failure. The only test left was one that pins phrases with `toContain`. By slice 8
there were 46 such tests in `tests/skills/`, and implementing that slice showed what they
check:

- Three of five tasks went red only because a pinned phrase broke across two lines; the fix
  was to reflow the text.
- `'merge'` passed before any change (the skill already said "merged"); `'his why'` would pass
  with "never ask his why".
- Each wording change restated tests: three for `slice 8` (spec 008 R5), and 007-US2-AS3's
  `not.toContain('aletheia card archive')` blocked the review skill from offering a
  replacement.
- Nothing ran the JSON examples a skill shows, which Claude copies into the real deck.

The constitution already says skills are reviewed through evals, not by reading prompts. What
do tests check over a skill, and what traces a skill scenario?

## Decision drivers

- A test fails when something Angelo relies on breaks, not when a line wraps.
- Tests go through the public interface: the `aletheia` commands.
- Every scenario id stays traced (constitution IV); traceability stays a grep.
- No eval ahead of a real failure (constitution IV).

## Considered options

1. Tests check only what code can check; a skill's judgment is traced by the quickstart step
   Angelo runs, until its eval exists
2. Keep the phrase tests
3. Validate the skills' examples against the zod schemas imported from the commands

## Decision outcome

Chosen option: **1**. `tests/skills/` checks, for each Aletheia skill: every `aletheia` command
it shows in a `sh` block runs through the CLI on an empty deck and is refused, if at all, only
for the empty deck (a card not found, no active card under the tags); every command it names
exists; it calls the installed `aletheia`; its triggers are its own. A scenario about a skill's
judgment is traced by naming its id in the quickstart step that checks it, which Angelo runs in
`prod` after the release; traceability reads `specs/*/quickstart.md`. An eval replaces that
trace after the skill's second real failure.

### Pros and cons of the options

**What code can check, judgment by quickstart**
- Good, because a renamed field, a removed flag or a bad example fails a test before Claude
  copies it.
- Good, because the skill's wording can change without restating tests.
- Bad, because nothing automated checks the judgment until an eval exists; the quickstart run
  and the two-week Measures are the check, as they already were in practice.
- Bad, because traceability accepts a quickstart mention for any id, a CLI scenario included;
  review and test-first keep CLI scenarios on tests.

**Phrase tests**
- Good, because every skill scenario has an automated test by name.
- Bad, because they pin wording, pass on text that says the opposite, and fail on a line break.

**Schemas imported**
- Good, because it is faster than running the CLI.
- Bad, because it goes around the public interface and misses flags, commands and the order of
  the checks.

## Consequences

- Good: the skill tests shrink to a few that fail for real reasons; 27 skill scenario ids are
  traced by their quickstart steps.
- Bad / cost: a skill's judgment can regress silently between a release and its quickstart run;
  the second real failure brings its eval.

## Confirmation

`tests/skills/skills.test.ts` fails on a fixture skill with an invalid example and an unknown
command; `tests/traceability/` covers an id named in a quickstart; constitution 1.7.0, IV.
