# 0003. Commander CLI, TOON by default, JSON on request

- **Status:** proposed
- **Date:** 2026-11-08
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

The CLI is read by Claude, not typed by a person (design §3, §9). It needs discoverable
`--help`, typed subcommands, few tokens on output, and a clean stdout. Diarium parses
arguments by hand with `parseArgs`. What parses arguments and what shape does output take?

## Decision drivers

- Generated `--help` and `--version` that open no store (spec edge cases).
- Typed options without hand-written parsing (Constitution VI).
- Uniform lists cost fewer tokens in TOON than in JSON (design §9).
- stdout holds results only; `env:` and diagnostics go to stderr (FR-003).

## Considered options

1. `commander` with `@commander-js/extra-typings`
2. `node:util` `parseArgs` plus a hand-written command table (diarium)
3. `yargs`

## Decision outcome

Chosen option: **1**. `exitOverride()` and `configureOutput()` route commander's errors to
stderr with exit 1 and an empty stdout; help and version write to stdout and exit 0. The store
is opened inside each command's action, so help, version and parse errors never touch it.
Results are written with `encode` from `@toon-format/toon`, or `JSON.stringify` on one line
with `--json`.

### Pros and cons of the options

**commander + extra-typings**
- Good, because help, version, unknown-command errors and option types come for free.
- Bad, because its default output and exit behaviour must be overridden.

**parseArgs + table**
- Bad, because help and errors are hand-written, as diarium had to.

**yargs**
- Bad, because heavier, and its types are weaker than extra-typings.

## Consequences

- Good: a new command is a declaration and an action.
- Bad / cost: tests must check commander's messages stay on stderr.

## Confirmation

CLI tests through `main()` cover 000-US1-AS1, AS2 and AS5.
