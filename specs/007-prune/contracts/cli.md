# CLI Contract: Prune

Adds to [slice 6's contract](../../006-progress/contracts/cli.md) and the earlier ones.
Streams, global options, exit codes and the shared errors are unchanged: stdout holds the
result only (TOON, or one-line JSON with `--json`), stderr starts with `env: <name>`, and any
failure is `error: <message>` with exit 1, an empty stdout and nothing written. Instants are
shown in local time with their offset. Rules are in [data-model.md](../data-model.md).

## `aletheia card archive`

Archives an active card with Angelo's reason (007-US1-AS2). JSON on stdin; prints the card as
`card show` does.

```sh
aletheia card archive <<'JSON'
{ "card": "q3rt", "reason": "no lo uso desde que dejé ese proyecto" }
JSON
```

| Field | Rule | Message when broken |
|---|---|---|
| `card` | an id | `invalid archive: card: is required` |
| `reason` | text, not blank | `invalid archive: reason: is required` |
| any other | none | `invalid archive: <field>: is not an archive field` |

Then `card "<id>" not found` or `card "<id>" is archived`.

## `aletheia card restore <id>`

Makes an archived card active again, with the schedule it had (007-US1-AS3). Prints the card.
Errors: `card "<id>" not found`, `card "<id>" is not archived`.

## `aletheia card keep <id> --reason <reason> [--overlaps <id>]`

Records that Angelo keeps a candidate for one reason (007-US4-AS1).

```sh
aletheia card keep k7m2 --reason leech
aletheia card keep 9p3x --reason overlapping --overlaps w2ab
```

```
card: 9p3x
reason: overlapping
overlaps: w2ab
keptAt: "2026-11-22T19:30:00-05:00"
```

| Option | Value | Message when broken |
|---|---|---|
| `--reason <reason>` | required: `leech`, `not-useful`, `outdated-situation` or `overlapping` | `--reason: is required`; `--reason: must be leech, not-useful, outdated-situation or overlapping` |
| `--overlaps <id>` | another card, with `overlapping` only | `--overlaps: goes with --reason overlapping, and only with it`; `--overlaps: must be another card` |

Option messages come in one `invalid options:` line joined by `; `; then `card "<id>" not
found` or `card "<id>" is archived`, for either card.

## `aletheia card candidates [tags...]`

The candidates the CLI finds, and the keeps of the last `keep-months` (007-US1-AS1, US2-AS2,
US4-AS2). `[tags...]` as in `tag stats`.

```sh
aletheia card candidates
aletheia card candidates messaging
```

```
candidates[2]:
  - id: k7m2
    question: "En Redis Streams, ¿cómo reparte un consumer group los mensajes…?"
    tags[1]: "messaging::redis-streams"
    reasons[1]: leech
    failures: 5
    lastFailure: "2026-11-20T10:15:00-05:00"
    notUseful: null
  - id: q3rt
    question: ¿Qué hace docker ps -a?
    tags[1]: "docker::commands"
    reasons[1]: not-useful
    failures: 0
    lastFailure: null
    notUseful:
      at: "2026-11-18T20:02:11-05:00"
      rationale: "Dijo: \"esto no me sirve, nunca lo uso\". La respuesta cubre los dos puntos."
kept[1]{card,reason,overlaps,keptAt}:
  9p3x,overlapping,w2ab,"2026-11-22T19:30:00-05:00"
```

- A kept leech comes back after a failure later than its keep; the other reasons after
  `keep-months`.
- Nothing to list: `candidates: []` and `kept: []`.

## Changed commands

- `card show <id>`: gains `archivedAt` and `archiveReason` after `status`, from the card's
  latest archive; `null` while active. `card edit`, `card archive` and `card restore` print
  the card the same way.
- `card list [tags...] --content`: each row gains `keyPoints` and `situation` (007-US3-AS1).
  `weak` is `failures >= leech-failures`.
- `card search`: matches words over archived cards too. Each item gains `status` and
  `archiveReason` (`null` when active), after `answer`. Cards sharing only a tag family are
  active ones.
- `tag stats`: `deck` gains `candidates`, last, the candidates of its scope (007-US1-AS5);
  `weak` is `failures >= leech-failures`.
- `review grade`: `flag` may be `not-useful`, which schedules and counts as no flag.
- `review history`: counts `not-useful` among the flags; `--flag not-useful` filters by it;
  reviews of archived cards stay.
- `review grade` and `card edit`: an archived card, or an archived `prerequisiteOf`, exits 1
  with `card "<id>" is archived`.
- `settings show`: five rows, `leech-failures` (3) and `keep-months` (6) after the three of
  slice 3. `settings set` takes `--leech-failures <n>` and `--keep-months <n>`: a whole number,
  1 or more, or `default`; broken, `--leech-failures: must be a whole number, 1 or more, or
  default`. With no setting: `name a setting: --session-size, --new-per-day, --new-share,
  --leech-failures or --keep-months`.
