# Quickstart: Prune

How Angelo checks slice 7 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 6 released and in use: `aletheia tag stats` answers from any directory.
- On the feature branch, `pnpm install`, and `pnpm check` green.
- In `test`, a few cards under two tag families, some graded (`pnpm aletheia card list`).

## 1. Archive and restore, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia card archive <<'JSON'
{ "card": "<id>", "reason": "ya no la uso" }
JSON
pnpm aletheia review due
pnpm aletheia card restore <id>
```

Expected: the card printed `archived` with its reason; it is absent from `review due`,
`card list` and `tag stats`; grading it exits 1 with `card "<id>" is archived`. Restored, it
is back with the same `due` and `state`.

## 2. A pruned card found at capture, in `test`

Archive a card, then search for a word of its question:

```sh
pnpm aletheia card search <<'JSON'
{ "words": "<a word of its question>" }
JSON
```

Expected: the card, `status: archived`, with its reason.

## 3. Leeches, in `test`

Grade a card already in review `again`, `good`, `again`, `good`, `again` (with an
`askedQuestion`): only an Again on a card in review is a failure, and `good` brings it back
from relearning. Then:

```sh
pnpm aletheia card candidates
pnpm aletheia tag stats
```

Expected: the card, reason `leech`, `failures: 3`; `deck.candidates: 1` and the card weak.

## 4. Said to be useless, in `test`

Grade a card with `"flag": "not-useful"`, then run `card candidates`. Expected: it is a
candidate `not-useful` with the review's rationale, and its schedule moved as with no flag.

## 5. Keep, in `test`

```sh
pnpm aletheia card keep <leech id> --reason leech
pnpm aletheia card candidates
```

Expected: the leech is gone, and listed under `kept`. Grade it `again` once more: it is back.

## 6. The reading, in `test`

```sh
pnpm aletheia card list <family> --content
```

Expected: each card of the family with its key points and situation.

## 7. Thresholds, in `test`

```sh
pnpm aletheia settings set --leech-failures 4
pnpm aletheia card candidates
pnpm aletheia settings set --leech-failures default
```

Expected: §3's card, with 3 failures, is no longer a candidate nor weak; with `default`, it is
again.

## 8. In `prod`, after the release

In a new Claude Code session in this repo, without a command or a `/`:

- "podemos el mazo": Claude lists the leeches and the cards said to be useless, one at a time,
  with their evidence, and waits for Angelo's choice on each; then offers to read topic by
  topic (SC-001, 007-US1-AS6, 007-US3-AS2).
- Keep a leech: Claude records the keep for the reason shown, and the next prune does not
  list it (007-US4-AS3).
- "poda mensajería": the same, under `messaging` only, and the reading of that topic.
- "devuélveme #<id>": the card is active again (007-US1-AS6).
- Reviewing, "esto no me sirve": the review is graded and flagged; the next prune lists it
  (007-US2-AS3).
- From another repo, a draft on something archived: `az-aletheia-add` quotes the archived card
  and its reason (007-US1-AS7).

## Measures

- SC-001: §8's first point, the day of the release.
- SC-002: Angelo, over the first two weeks: every archive and keep was his choice, and every
  archived card shows his reason (`card show`).
- SC-003: Angelo, over the first two weeks: no kept card came back without a new failure or
  the end of its months.
- SC-004: `tests/progress/performance.test.ts`, on 1,000 cards and 20,000 reviews.
