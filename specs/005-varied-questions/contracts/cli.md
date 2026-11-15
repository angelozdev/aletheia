# CLI Contract: Varied Questions

Adds to [slice 4's contract](../../004-gaps-and-rewrites/contracts/cli.md) and the earlier
ones. Streams, global options, exit codes and the shared errors are unchanged: stdout holds the
result only (TOON, or one-line JSON with `--json`), stderr starts with `env: <name>`, and any
failure is `error: <message>` with exit 1 and an empty stdout.

## `aletheia review grade`, one required field and one more flag

```sh
aletheia review grade <<'JSON'
{"card":"k7m2","grade":"good","claudeGrade":"good","answer":"Cada mensaje va a un solo consumidor del grupo.","rationale":"Cubre los dos key points.","askedQuestion":"Tienes dos workers leyendo el mismo stream de Redis con un consumer group: ¿cómo se reparten los mensajes?"}
JSON
aletheia review grade <<'JSON'
{"card":"9p3x","grade":"again","claudeGrade":"again","answer":"Habla de la respuesta HTTP del consumidor.","rationale":"Mi reformulación quitó el ack y se leyó como otra cosa.","askedQuestion":"¿Qué le pasa al mensaje cuando el consumidor responde?","flag":"badly-rephrased"}
JSON
```

| Field | Rule | Message when broken |
|---|---|---|
| card, grade, claudeGrade, answer, rationale | as in slice 1 | as in slice 1 |
| askedQuestion | required; text, not blank | `is required` |
| flag | optional; `missing-prerequisite`, `badly-written` or `badly-rephrased` | `must be missing-prerequisite, badly-written or badly-rephrased`; `missing-prerequisite needs the grade again` |
| prerequisiteOf | as in slice 4 | as in slice 4 |

Messages follow the order of this table, joined by `; `, in one `invalid review:` line. The CLI
does not compare `askedQuestion` with the card's question.

stdout is slice 1's: `card`, `grade`, `state`, `due`. With `flag: badly-rephrased`, whatever
the grade, the review is voided, so `state` and `due` are the card's, unchanged (005-US2-AS1).

Errors, with neither the log nor the card's schedule changed:

- `error: invalid review: askedQuestion: is required` (missing, or blank) (005-US1-AS2)
- `error: invalid review: flag: must be missing-prerequisite, badly-written or badly-rephrased`

## `review due` and `review topic`

Same options and output. A review flagged `badly-rephrased` follows slice 4's rules for a
voided review (005-US2-AS2):

- its card is left out from that review until the start of the next local day, and `nextDue`
  is at most then;
- it counts toward its session's cap;
- it does not count toward the day's new cards.

## `aletheia card show`

Unchanged. After any grade, `question` is the stored one (005-US1-AS1).
