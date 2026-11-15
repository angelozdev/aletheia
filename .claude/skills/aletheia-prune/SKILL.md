---
name: aletheia-prune
description: Use when Angelo wants to prune his Aletheia deck in this repo, or to archive or bring back a card. Triggers on "podemos el mazo", "podemos <tema>", "limpiemos el mazo", "archiva #<id>", "devuélveme #<id>". Proposes cards to prune one at a time with their reason, and archives, restores or changes a card only after Angelo chooses, through the installed aletheia CLI.
---

# aletheia-prune

Pruning Angelo's real deck: retiring what no longer earns its place, so the deck stays his.
Talk to Angelo in Spanish. The `aletheia` CLI holds the facts (a card, its reviews, its
status); you propose, and Angelo decides.

## Rules

- Every fact about a card is answered by running `aletheia` in that turn, never from memory or
  from earlier in the session.
- Nothing is archived, restored or changed without Angelo's choice for that card. The skill
  never on its own archives a card, even one the CLI lists or one you judge useless.
- The CLI is the only writer. Never open, read or edit a store file, never write SQL, never
  choose an environment: plain `aletheia` is the real deck.
- Instants come in Angelo's local time with their offset (`2026-11-11T10:00:00-05:00`). Read
  them as printed; never convert a time zone.

## 1. Archive or bring back a card Angelo names

### "archiva #q3rt, ya no la uso"

Show the card first, so he sees what he is retiring:

```sh
aletheia card show q3rt
```

Quote its question in a line. If Angelo gave no reason, ask for one: the archive needs it, and
it is what he reads when the card turns up again. Then archive it, the id without `#` and
the reason in his words, through a quoted heredoc:

```sh
aletheia card archive <<'JSON'
{"card":"q3rt","reason":"No la uso desde que dejé ese proyecto."}
JSON
```

- `reason`: Angelo's reason as he said it, in Spanish, never one you made up or shortened
  into another meaning.

An archived card leaves the reviews, the lists and the progress; its schedule and its reviews
stay, and the duplicate search still finds it. Say so in a line.

If the CLI answers `card "q3rt" is archived`, it already was: say so and show its
`archiveReason`.

### "devuélveme #q3rt"

```sh
aletheia card restore q3rt
```

It comes back active with the schedule it had: if it was overdue, it is due now. If the CLI
answers `card "q3rt" is not archived`, it is already active; say so.

## 2. The CLI's candidates ("podemos el mazo", "podemos mensajería")

For the whole deck:

```sh
aletheia card candidates
```

For a topic named in Spanish, list the tags in use first:

```sh
aletheia tag list
```

Pick every tag that covers the topic; a topic can span branches ("redis" →
`messaging::redis-streams` and `databases::redis`). Then narrow the candidates to them,
descendants included:

```sh
aletheia card candidates messaging::redis-streams databases::redis
```

It prints `candidates`, each with `id`, `question` (as stored), `tags`, `reasons` and the
evidence for each reason:

- `leech`: the card failed `failures` times, ever, its last failure at `lastFailure`. A
  failure is an Again on a card already learned, not voided and not flagged
  `missing-prerequisite`. A leech is usually badly written, holds two ideas, or is something
  Angelo no longer needs.
- `not-useful`: Angelo said in a review that the card adds nothing. `notUseful` gives when
  (`at`) and the rationale of the latest such review, which quotes him; quote it back.

A card can carry both reasons; show both.

`candidates: []` means the CLI finds nothing to prune there; say so.

Go through them one at a time, in the order printed. For each, quote its id, its stored
question and its reasons with their evidence, in Spanish:

```
#k7m2 · messaging::redis-streams
  En Redis Streams, ¿cómo reparte un consumer group los mensajes entre sus consumidores?
  Leech: 5 fallos, el último el 20 de noviembre.
  Dijiste que no te sirve (18 de noviembre): «esto no me sirve, nunca lo uso».
```

Offer what can be done with it, and wait for Angelo to choose before the next one:

- **Archive it**: as in section 1, with his reason in his words.
- **Rewrite it in place**: only when the card still asks for the same knowledge, a clearer
  question, a tidier answer or key points of the same meaning. Show the exact before and after
  of every field that changes, as the `aletheia-review` skill does, and run `aletheia card edit`
  only after he approves:

  ```sh
  aletheia card edit <<'JSON'
  {"card":"k7m2","question":"En Redis Streams, ¿cómo reparte un consumer group los mensajes de un stream entre sus consumidores?"}
  JSON
  ```

  When the fix would change what the key points mean, the card needs replacing, which arrives
  with slice 8: say so in a line and offer the other choices.
- **Keep it**: Angelo wants it as it is. Record the keep for the reason he was shown, one
  call per reason when the card has two and he keeps it for both:

  ```sh
  aletheia card keep k7m2 --reason leech
  ```

  `--reason` is `leech` or `not-useful`, as printed in `reasons`. A kept leech is not proposed
  again until a new failure after the keep; a card kept as `not-useful`, not for six months.
  Say so in a line.
- **Leave it**: nothing is recorded, and the CLI lists it again next time.

Never choose for him, and never act on two cards at once.
