# CLI Contract: Intake Filter

One command added to [slice 1's contract](../../001-capture-and-review/contracts/cli.md).
Streams, global options, exit codes and shared errors are unchanged: stdout holds the result only
(TOON, or one-line JSON with `--json`), stderr starts with `env: <name>`, and any failure is
`error: <message>` with exit 1 and an empty stdout.

## `aletheia card search`

The active cards most similar to a draft, for Claude to judge (002-US1-AS1 to AS6). It never says
whether a card is a duplicate.

stdin, one object, through a quoted heredoc:

```sh
aletheia card search <<'JSON'
{
  "words": "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`? detenidos stopped exited --all",
  "tags": ["docker::commands"]
}
JSON
```

| Field | Rule | Message when broken |
|---|---|---|
| words | text, optional | `must be text` |
| tags | a list, optional; each tag by the grammar of `card add` | `must be a list`; `tags[<i>]: use a-z, digits and dashes, in segments joined by ::` |

At least one of the two must say something: blank words and no tags is refused. Any other field
is refused: `<field>: is not a search field`. Words made only of common words search nothing and,
without tags, give an empty list.

How words and tags match, and the order, follow [data-model.md](../data-model.md): word matches
sharing a tag family, then word matches, then cards sharing only a tag family; at most 10.

stdout:

```
cards[1]:
  - id: k7m2
    type: command
    tags[1]: "docker::commands"
    question: "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?"
    answer: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.
```

Nothing similar:

```
cards: []
```

JSON: `{"cards":[{"id":"k7m2","type":"command","tags":["docker::commands"],"question":"…","answer":"…"}]}`

Errors:

- `error: invalid JSON on stdin: <reason>` (also when stdin is empty)
- `error: invalid search: give words, tags or both`
- `error: invalid search: tags[0]: use a-z, digits and dashes, in segments joined by ::`
- `error: invalid search: limit: is not a search field`
