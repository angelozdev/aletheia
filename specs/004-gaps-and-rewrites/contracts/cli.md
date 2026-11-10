# CLI Contract: Gaps and Rewrites

Adds to [slice 1's contract](../../001-capture-and-review/contracts/cli.md),
[slice 2's](../../002-intake-filter/contracts/cli.md) and
[slice 3's](../../003-topic-review/contracts/cli.md). Streams, global options, exit codes and
the shared errors are unchanged: stdout holds the result only (TOON, or one-line JSON with
`--json`), stderr starts with `env: <name>`, and any failure is `error: <message>` with exit 1
and an empty stdout. Instants are shown in local time with their offset.

## `aletheia review grade`, two optional fields

```sh
aletheia review grade <<'JSON'
{"card":"k7m2","grade":"again","claudeGrade":"again","answer":"No recuerda qué es un consumer group.","rationale":"Le falta el concepto base.","flag":"missing-prerequisite"}
JSON
aletheia review grade <<'JSON'
{"card":"c4gr","grade":"again","claudeGrade":"again","answer":"No lo sabe.","rationale":"No recuerda el concepto.","prerequisiteOf":"k7m2"}
JSON
```

| Field | Rule | Message when broken |
|---|---|---|
| card, grade, claudeGrade, answer, rationale | as in slice 1 | as in slice 1 |
| flag | optional; `missing-prerequisite` or `badly-written` | `must be missing-prerequisite or badly-written`; `missing-prerequisite needs the grade again` |
| prerequisiteOf | optional; the id of another existing card | `must be another card`; `card "<id>" not found` |

Messages follow the order of this table, joined by `; `, in one `invalid review:` line, except
`card "<id>" not found`, which is its own error, as for `card`.

stdout is slice 1's: `card`, `grade`, `state`, `due`. With `flag: badly-written` the review is
voided, so `state` and `due` are the card's, unchanged (004-US2-AS1).

Errors, with neither the log nor the card's schedule changed:

- `error: invalid review: flag: must be missing-prerequisite or badly-written`
- `error: invalid review: flag: missing-prerequisite needs the grade again`
- `error: invalid review: prerequisiteOf: must be another card`
- `error: card "zzzz" not found`

## `review due` and `review topic`, three rules

Same options and output as slice 3 (data-model.md):

- A card with a voided review since the start of the local today is left out; when one is,
  `nextDue` is at most the start of tomorrow (004-US2-AS2).
- A card whose first review in the session names a `prerequisiteOf` does not count toward the
  session's cap (004-US1-AS3). A voided review counts (004-US2-AS3).
- New cards first graded as a prerequisite, or voided, do not count toward the day's new
  cards (004-US1-AS3, 004-US2-AS3).

## `aletheia card edit`

Changes a card in place, keeping its id, source, schedule and reviews (004-US3-AS1 to AS3).

```sh
aletheia card edit <<'JSON'
{"card":"9p3x","question":"En una cola clásica de RabbitMQ, ¿qué pasa con un mensaje después de que el consumidor lo confirma con `ack`?","tags":["messaging::rabbitmq"]}
JSON
```

| Field | Rule | Message when broken |
|---|---|---|
| card | the id of an existing card | `is required`; `card "<id>" not found` |
| type, question, answer, keyPoints, situation, tags | each optional, by the rules of `card add` | `card add`'s messages |

At least one field besides `card`. Any other field (`source`, `id`, `due`, …) is refused:
`<field>: is not an edit field`. Messages follow the order of the table, joined by `; `.

stdout: the edited card, every field, as `card show` prints it, with `updatedAt` at the edit.

Errors, with the card unchanged:

- `error: invalid JSON on stdin: <reason>` (also when stdin is empty)
- `error: invalid edit: give a field to change`
- `error: invalid edit: keyPoints: must have 1 to 3 items; source: is not an edit field`
- `error: card "zzzz" not found`
