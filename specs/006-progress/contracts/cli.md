# CLI Contract: Progress

Adds to [slice 5's contract](../../005-varied-questions/contracts/cli.md) and the earlier
ones. Streams, global options, exit codes and the shared errors are unchanged: stdout holds the
result only (TOON, or one-line JSON with `--json`), stderr starts with `env: <name>`, and any
failure is `error: <message>` with exit 1 and an empty stdout. Instants are shown in local time
with their offset. No command here writes to the store. Rules are in
[data-model.md](../data-model.md).

## Shared by the three commands

- `[tags...]`, optional: one or more tags, each with its descendants, as in `review topic`.
  Without tags, the whole deck.
- `--sort <field>`, `--desc`: an output field, as printed; `--desc` reverses its order. `null`
  is last either way.
- Errors, in this order: the option messages, in one `invalid options:` line joined by `; `;
  then `error: invalid topic: …` and `error: no active card under …`, as in `review topic`.
- A window of N days runs from the start of the local day N−1 days ago up to now: 1 is today.

## `aletheia tag stats [tags...]`

The progress tree (006-US1).

```sh
aletheia tag stats
aletheia tag stats messaging --sort retention
```

```
deck:
  cards: 14
  new: 2
  due: 3
  retention: 78
  weak: 1
  gaps: 2
tags[3]{tag,cards,new,due,retention,weak,gaps}:
  messaging,12,2,3,78,1,2
  "messaging::rabbitmq",4,0,1,91,0,0
  "messaging::redis-streams",8,2,2,71,1,2
```

- `deck`: every card in scope, each once.
- `due`: cards already seen, due before the local day ends; `new` counts the cards never seen.
- `retention`: a whole percent over the last 30 days, or `null`.
- `weak`: cards with 4 failures or more, ever (amended by spec 007: the `leech-failures`
  setting, 3 by default). `gaps`: reviews flagged `missing-prerequisite` in
  the last 30 days.

| Option | Value | Message when broken |
|---|---|---|
| `--sort <field>` | `tag`, `cards`, `new`, `due`, `retention`, `weak` or `gaps`; default `tag` | `--sort: must be tag, cards, new, due, retention, weak or gaps` |
| `--desc` | no value | |

Siblings are sorted under their parent, so each row still follows its parent. On an empty deck:
`deck` with zeros and `retention: null`, and `tags: []`.

## `aletheia card list [tags...]`

The cards in scope that match every filter given (006-US2).

```sh
aletheia card list messaging --weak --sort failures --desc
aletheia card list --not-reviewed 30
```

```
cards[1]:
  - id: k7m2
    question: "En Redis Streams, ¿cómo reparte un consumer group los mensajes…?"
    tags[1]: "messaging::redis-streams"
    state: relearning
    due: "2026-11-15T10:12:00-05:00"
    lastReview: "2026-11-15T10:02:00-05:00"
    failures: 4
    gaps: 1
    weak: true
```

| Option | Value | Message when broken |
|---|---|---|
| `--weak` | no value: only weak cards | |
| `--gaps` | no value: only cards with a gap in the last 30 days | |
| `--not-reviewed <days>` | a whole number, 1 or more: cards with no review in that window | `--not-reviewed: must be a whole number, 1 or more` |
| `--sort <field>` | `id`, `state`, `due`, `lastReview`, `failures` or `gaps`; default `lastReview` | `--sort: must be id, state, due, lastReview, failures or gaps` |
| `--desc` | no value | |

- `lastReview` counts voided reviews; `null` when never reviewed. `--not-reviewed` includes a
  card never reviewed when it was saved before the window.
- Nothing matches: `cards: []`.

## `aletheia review history [tags...]`

The reviews of a window, newest first, and their counts (006-US3).

```sh
aletheia review history --days 14 --flag badly-rephrased
aletheia review history --days 7 --grade again
```

```
counts:
  reviews: 2
  grades:
    again: 1
    hard: 0
    good: 1
    easy: 0
  flags:
    "missing-prerequisite": 0
    "badly-written": 0
    "badly-rephrased": 1
  disputed: 1
reviews[2]{card,reviewedAt,grade,claudeGrade,flag,askedQuestion}:
  9p3x,"2026-11-14T09:30:00-05:00",good,good,badly-rephrased,¿Qué le pasa al mensaje cuando el consumidor responde?
  k7m2,"2026-11-13T19:05:00-05:00",again,hard,null,null
```

- Counts are over the reviews listed, after every filter. `disputed`: Angelo's grade differs
  from Claude's.
- `askedQuestion` is `null` for reviews recorded before slice 5.

| Option | Value | Message when broken |
|---|---|---|
| `--days <n>` | a whole number, 1 or more; default 7 | `--days: must be a whole number, 1 or more` |
| `--grade <grade>` | `again`, `hard`, `good` or `easy` | `--grade: must be again, hard, good or easy` |
| `--flag <flag>` | `missing-prerequisite`, `badly-written` or `badly-rephrased` | `--flag: must be missing-prerequisite, badly-written or badly-rephrased` |

No review in the window: zero counts and `reviews: []`.
