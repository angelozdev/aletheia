# Quickstart: Progress

How Angelo checks slice 6 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 5 released and in use: `aletheia review due` answers from any directory.
- On the feature branch, `pnpm install`, and `pnpm check` green.
- In `test`, cards under at least two tag families, some graded (`pnpm aletheia tag list`).

## 1. The tree, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia tag stats
```

Expected: a `deck` line and one row per tag in use and its ancestors. Grade a card that is
already in review `again` (with an `askedQuestion`), run it again, and its tags' `retention`
drops. A card saved today adds to `new`, not to `due`.

## 2. Filter and sort, in `test`

```sh
pnpm aletheia tag stats <family>
pnpm aletheia tag stats --sort retention
pnpm aletheia tag stats --sort nope
```

Expected: only `<family>` and its descendants; then siblings ordered by retention, worst first,
each under its parent, `null` last; then exit 1 with
`invalid options: --sort: must be tag, cards, new, due, retention, weak or gaps`.

## 3. The cards, in `test`

```sh
pnpm aletheia card list --not-reviewed 1
pnpm aletheia card list <family> --sort failures --desc
```

Expected: the cards with no review today, the oldest review first and never-reviewed ones
last; then the family's cards, most failures first.

## 4. The history, in `test`

```sh
pnpm aletheia review history --days 1
pnpm aletheia review history --days 1 --grade again
```

Expected: today's reviews, newest first, with the question as asked, and counts that add up to
`reviews`; then only the Agains, with counts over them alone.

## 5. In `prod`, after the release

In a new Claude Code session in this repo, without a command or a `/`:

- "¿qué tengo flojo?": Claude runs `aletheia tag stats` and names the topics with weak cards or
  low retention, then the weak cards (SC-001, 006-US1-AS6).
- "¿qué no repaso hace un mes?": the cards, from `aletheia card list --not-reviewed 30`
  (006-US2-AS4).
- "¿cuántos repasos anulaste por reformulación estas dos semanas?": the count from
  `aletheia review history --days 14`, quoted, not counted by Claude (006-US3-AS2).

## Measures

- SC-001: §5's first point, the day of the release.
- SC-002: Angelo, over the first two weeks: every progress number Claude states is one the CLI
  printed in that turn.
- SC-003: `tests/progress/performance.test.ts`, on 1,000 cards and 20,000 reviews.
- SC-004: when their two weeks end, Angelo reads 004 SC-003 and 005 SC-002 from
  `aletheia review history` (T014 of slice 4, T007 of slice 5).
