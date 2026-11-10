# CLI Contract: Topic Review

Adds to [slice 1's contract](../../001-capture-and-review/contracts/cli.md) and
[slice 2's](../../002-intake-filter/contracts/cli.md). Streams, global options, exit codes and
the shared errors are unchanged: stdout holds the result only (TOON, or one-line JSON with
`--json`), stderr starts with `env: <name>`, and any failure is `error: <message>` with exit 1
and an empty stdout. Instants are shown in local time with their offset.

## `aletheia tag list`

Every tag in use by an active card, and its ancestors, with how many active cards each covers,
sorted by segments (003-US1-AS1; data-model.md).

```
tags[5]{tag,cards}:
  docker,1
  "docker::commands",1
  messaging,2
  "messaging::rabbitmq",1
  "messaging::redis-streams",1
```

JSON: `{"tags":[{"tag":"docker","cards":1},…]}`. On an empty deck: `tags: []`.

## Session options

`review due` and `review topic` take these. Each is optional:

| Option | Value | Default |
|---|---|---|
| `--session <instant>` | the `session` a previous call of this round printed | a new session, starting now |
| `--session-size <n>` | a whole number, 1 or more | the setting, else 20 |
| `--new-per-day <n>` | a whole number, 0 or more | the setting, else 10 |
| `--new-share <percent>` | a whole number from 0 to 100 | the setting, else 10 |

Messages, all in one line, joined by `; `, in the order of the table:

- `error: invalid options: --session: must be an instant with its offset, like 2026-11-10T10:00:00-05:00`
- `error: invalid options: --session: is in the future`
- `error: invalid options: --session-size: must be a whole number, 1 or more`
- `error: invalid options: --new-per-day: must be a whole number, 0 or more`
- `error: invalid options: --new-share: must be a whole number from 0 to 100`

## `aletheia review due`, changed

It now applies the session cap, the daily limit and the new share (003-US2, 003-US3). Its order
and its (re)learning rules are slice 1's, and the session's places are in data-model.md.

```
session: "2026-11-10T10:00:00-05:00"
count: 20
remaining: 90
heldBack: 40
capReached: false
nextDue: null
cards[20]:
  - id: k7m2
    type: command
    tags[1]: "docker::commands"
    question: …
    keyPoints[2]: …
    answer: …
  …
```

- `session`: the instant this session began. Repeat it with `--session` on the next call of
  the same round.
- `remaining`: the cards eligible now that did not fit in the session.
- `heldBack`: the new cards waiting for tomorrow because of the daily limit.
- `capReached`: the session has graded its size in distinct cards. `cards` then holds only
  re-shows.
- `nextDue`: when the next card that is not eligible now becomes eligible, or `null`.

At the cap (003-US2-AS2):

```
session: "2026-11-10T10:00:00-05:00"
count: 1
remaining: 5
heldBack: 0
capReached: true
nextDue: "2026-11-11T09:00:00-05:00"
cards[1]:
  - id: p3x9
    …
```

## `aletheia review topic <tag>...`

A topic's cards, due or not (003-US1-AS2 to AS7). It takes the session options. Its output is
that of `review due`, with `heldBack: 0`.

```sh
aletheia review topic messaging databases::redis --session "2026-11-10T10:00:00-05:00"
```

Order: (re)learning cards due, review cards due today, new cards, then review cards not due,
soonest first. A card not due that was graded today is left out.

Errors, after the option errors:

- `error: invalid topic: messaging::Redis: use a-z, digits and dashes, in segments joined by ::`
  (each malformed tag, joined by `; `)
- `error: no active card under kafka` (or `under kafka, nats`)
- no tag: commander's usage error, exit 1

## `aletheia settings show`

```
settings[3]{name,value,default}:
  session-size,15,false
  new-per-day,10,true
  new-share,10,true
```

`default: true` means not saved: the built-in value applies (003-US4-AS1). Names are the
options' names.

JSON: `{"settings":[{"name":"session-size","value":15,"default":false},…]}`

## `aletheia settings set`

Changes the settings it names and prints them as `settings show` does (003-US4-AS2, AS3).

```sh
aletheia settings set --session-size 15 --new-share 20
aletheia settings set --session-size default
```

Each of `--session-size`, `--new-per-day` and `--new-share` takes the values of the session
options, or `default` to forget the saved value.

Errors, with nothing changed:

- `error: invalid settings: --session-size: must be a whole number, 1 or more, or default; --new-share: must be a whole number from 0 to 100, or default`
- `error: name a setting: --session-size, --new-per-day or --new-share`
