# 0012. ts-fsrs 5 with FSRS-6 and one learning step, behind one core module

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

The design fixes FSRS through `ts-fsrs`. Slice 1 has to pick a version, a model and the
first-day behaviour, and `ts-fsrs` 6.0.0 came out twelve days before the plan with a new
scheduler API and a new default model. Which version and parameters schedule Angelo's cards,
and how much of the code knows the library?

## Decision drivers

- A modern, proven algorithm (design §2).
- The first day Angelo decided in spec 001: a new card graded Good is not asked again that
  day; one graded Again or Hard comes back once, about ten minutes later.
- Slice 0's rule: a release at least two weeks old.
- A later change of version or model touches one place.

## Considered options

1. `ts-fsrs` 5.4.2, `fsrs()` with FSRS-6
2. `ts-fsrs` 6.0.0, the same `fsrs()` API
3. `ts-fsrs` 6.0.0, the new `DefaultScheduler` with FSRS-7

## Decision outcome

Chosen option: **1**, with `generatorParameters({ learning_steps: ['10m'] })`: default
weights, desired retention 0.9, no fuzz, short-term steps on, the default 10-minute relearning
step, no optimizer. Only `src/core/scheduling` imports `ts-fsrs` (lint); it maps a card row to
the library's card and back and receives the clock.

### Pros and cons of the options

**5.4.2 with FSRS-6**
- Good, because it is the model Anki ships, measured here against the first day Angelo chose,
  with no dependency of its own.
- Bad, because it is the previous major.

**6.0.0 with `fsrs()`**
- Bad, because that API is deprecated there and gives the same schedule as 5.4.2.

**6.0.0 with `DefaultScheduler` and FSRS-7**
- Good, because leech handling, statistics and a replay of the review history ship with it.
- Bad, because the release and its API are twelve days old; FSRS-7 spaces reviews far wider
  (a first Good returns in 4.8 days instead of 2, a first Easy in 54 instead of 8), which
  nobody here has lived with; and its card has other fields (`stabilityFast`, fractional days).

## Consequences

- Good: the schedule is the one measured in research R6, and the library sits behind one module.
- Bad / cost: a migration to `ts-fsrs` 6 is owed and must be thought through (design §14): the
  model, new columns, and whether to replay the review log, which is never deleted, into it.

## Confirmation

`src/core/scheduling` tests cover 001-US2-AS3 and AS8 with a fixed clock; lint forbids
`ts-fsrs` outside that module.
