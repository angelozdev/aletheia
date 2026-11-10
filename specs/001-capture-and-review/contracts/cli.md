# CLI Contract: Capture and Review

Four commands added to [slice 0's contract](../../000-skeleton/contracts/cli.md). Streams,
global options, exit codes and the shared errors are unchanged: stdout holds the result only
(TOON, or one-line JSON with `--json`), stderr starts with `env: <name>`, and any failure is
`error: <message>` with exit 1 and an empty stdout.

- Ids go without `#`: a shell reads `#k7m2` as a comment.
- Instants on stdout are in the local time of whoever runs the CLI, with the offset
  (`2026-11-09T10:00:00-05:00`). They are stored in UTC (data-model.md).
- JSON input is read from stdin. The skills pass it through a quoted heredoc (`<<'JSON'`), so
  backticks, accents and multi-line code arrive untouched.

## `aletheia card add`

Saves the cards on stdin, all or none (001-US1-AS1 to AS4).

stdin, a list of one or more cards:

```json
[
  {
    "type": "command",
    "question": "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?",
    "answer": "`ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.",
    "keyPoints": ["`ps`: solo en ejecución", "`-a`: incluye detenidos"],
    "situation": "Un contenedor se cayó y no aparece en `docker ps`.",
    "tags": ["docker::commands"],
    "source": "diarium"
  }
]
```

| Field | Rule | Message when broken |
|---|---|---|
| type | `concept`, `comparison`, `command`, `scenario` or `code` | `must be concept, comparison, command, scenario or code` |
| question, answer, situation, source | text, not blank | `is required` |
| keyPoints | 1 to 3 texts, none blank | `must have 1 to 3 items`; `keyPoints[<i>]: is required` |
| tags | 1 or more, none repeated, each matching the grammar in data-model.md | `must have at least one tag`; `tags[<i>]: use a-z, digits and dashes, in segments joined by ::`; `tags[<i>]: is repeated` |

A missing field is `is required`. Any other field is refused: `<field>: is not a card field`.
A card's messages follow the order of this table. Every card starts `active` and `new`, due at
once.

stdout, the ids in the order of the input:

```
ids[2]: k7m2,p3x9
```

JSON: `{"ids":["k7m2","p3x9"]}`

An id made of digits only is quoted, as TOON quotes any string that reads as a number:
`ids[1]: "0123"`, and `id: "0123"` in `card show`.

Errors, with nothing stored:

- `error: invalid JSON on stdin: <reason>` (also when stdin is empty)
- `error: expected a list of one or more cards`
- `error: card 2: situation: is required; tags[0]: use a-z, digits and dashes, in segments joined by ::`
  A card is named by its position in the list, from 1. Fields of one card are joined by `; `,
  cards by ` | `.

## `aletheia card show <id>`

Every field of a card and when it comes back (001-US1-AS5).

```
id: k7m2
type: command
tags[1]: "docker::commands"
question: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?"
answer: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.
keyPoints[2]: "`ps`: solo en ejecución","`-a`: incluye detenidos"
situation: Un contenedor se cayó y no aparece en `docker ps`.
source: diarium
status: active
state: new
due: "2026-11-09T10:00:00-05:00"
lastReview: null
stability: 0
difficulty: 0
scheduledDays: 0
learningSteps: 0
reps: 0
lapses: 0
createdAt: "2026-11-09T10:00:00-05:00"
updatedAt: "2026-11-09T10:00:00-05:00"
```

Error: `error: card "zzzz" not found`

## `aletheia review due`

The due list, in the order of data-model.md (001-US2-AS1, AS4, AS5).

```
count: 1
nextDue: null
cards[1]:
  - id: k7m2
    type: command
    tags[1]: "docker::commands"
    question: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?"
    keyPoints[2]: "`ps`: solo en ejecución","`-a`: incluye detenidos"
    answer: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.
```

With nothing due, `nextDue` is the earliest instant among the other active cards, or `null`
on an empty deck:

```
count: 0
nextDue: "2026-11-11T10:00:00-05:00"
cards: []
```

## `aletheia review grade`

Records one grade and reschedules the card, both or neither (001-US2-AS2, AS3, AS6, AS8).

stdin, one object:

```json
{
  "card": "k7m2",
  "grade": "easy",
  "claudeGrade": "good",
  "answer": "ps muestra los que corren, -a todos",
  "rationale": "Cubre los dos key points, sin dudar."
}
```

| Field | Rule |
|---|---|
| card | the id of an existing card; it need not be due (an early review is recorded) |
| grade | `again`, `hard`, `good` or `easy`: Angelo's final grade |
| claudeGrade | the same four: the grade Claude gave before any dispute |
| answer, rationale | text, not blank |

Any other field is refused.

stdout:

```
card: k7m2
grade: easy
state: review
due: "2026-11-17T10:00:00-05:00"
```

Errors, with neither the log nor the card's schedule changed:

- `error: invalid JSON on stdin: <reason>`
- `error: invalid review: grade: must be again, hard, good or easy; rationale: is required`
- `error: card "zzzz" not found`

## `pnpm release`, one more step

After step 4 of slice 0's contract (`release: <version> (<commit>) installed`):

5. Copies `skills/az-aletheia-add/` of the released commit into
   `~/.aletheia/skills/az-aletheia-add/`, replacing the previous copy whole, and prints
   `release: skill az-aletheia-add copied to <folder>`. A copy that fails:
   `release: failed: cannot copy the skill to <folder>: <reason>`, exit 1, the previous copy
   left as it was. Nothing is written under `~/.claude/` (001-US1-AS7).

With no skills folder to write to, which is how the release entry runs under vitest, the
release refuses before its first step: `release: refused: skill copies are disabled here
(under vitest)` (INV-01).
