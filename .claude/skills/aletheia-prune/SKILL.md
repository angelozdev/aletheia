---
name: aletheia-prune
description: Use when Angelo wants to prune his Aletheia deck in this repo, or to archive or bring back a card. Triggers on "podemos el mazo", "poda <tema>", "limpiemos el mazo", "archiva #<id>", "devuélveme #<id>". Proposes cards to prune one at a time with their reason, and archives, restores or changes a card only after Angelo chooses, through the installed aletheia CLI.
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

## 2. The CLI's candidates ("podemos el mazo", "poda mensajería")

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

- `leech`: the card failed `failures` times, ever, its last failure at `lastFailure`; 3
  failures make a leech, unless Angelo changed the `leech-failures` setting. A failure is an
  Again on a card already learned, not voided and not flagged `missing-prerequisite`. A leech is usually badly written, holds two ideas, or is something
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
  again until a new failure after the keep; a card kept as `not-useful`, not for six months
  (the `keep-months` setting). Say so in a line.
- **Leave it**: nothing is recorded, and the CLI lists it again next time.

Never choose for him, and never act on two cards at once.

### Replace, split or merge

A merge (two cards into one), a split (one card into one per idea) and a replacement (one card
whose fix changes what it asks) are the same two steps: save the new cards, then archive each
old card naming them. The new cards follow the card rules of the `az-aletheia-add` skill.

Show each old card's question and each draft with every field, as `az-aletheia-add` shows a
draft. Wait until Angelo approves the exact drafts, with his edits, and ask his why in his
words if he has not said it: it goes in each old card's archive reason. Save and archive
only after Angelo approves.

Save every draft in one call, its `source` naming the old cards:

```sh
aletheia card add <<'JSON'
[
  {
    "type": "concept",
    "question": "En un broker de mensajes, ¿qué pasa con un mensaje que el consumidor recibió pero no confirmó con un ack?",
    "answer": "Queda pendiente y el broker puede volver a entregarlo. En Redis Streams queda en la PEL hasta `XACK`; en RabbitMQ vuelve a la cola si el canal se cierra sin `ack`.",
    "keyPoints": ["queda pendiente hasta el ack", "Redis Streams: en la PEL hasta `XACK`", "RabbitMQ: vuelve a la cola si el canal se cierra sin `ack`"],
    "situation": "Un consumidor se cae a mitad de procesar un mensaje.",
    "tags": ["messaging"],
    "source": "reemplaza a #9p3x, #w2ab"
  }
]
JSON
```

Read the ids it prints (`ids[1]: a7k2`). Then archive each old card, one call per card, the id
without `#`, the reason `reemplazada por #<id>[, #<id>…]: <his why>`:

```sh
aletheia card archive <<'JSON'
{"card":"9p3x","reason":"reemplazada por #a7k2: se solapaban, mejor una con ambos ejemplos"}
JSON
```

The old cards keep their reviews. The new cards are new: the day's new-card limit applies to
them, and FSRS spaces them out quickly when he grades them Easy. Say so in a line.

If `aletheia card add` exits 1, nothing was saved: read the `error:` line, fix the JSON and
send it again. If an `aletheia card archive` exits 1 after the save, say which old card is
still active beside the new one, fix the JSON and archive it again; never send the drafts
a second time.

## 3. What only reading finds

After the CLI's candidates, read the cards themselves for what no number shows: a situation
that no longer applies to Angelo, and two cards that ask nearly the same. These are your
judgment, not the CLI's: say so for each one ("es mi juicio, no un dato": my judgment, not a
fact).

First read Angelo's profile, `~/me/aletheia/PROFILE.md`: his level by area and what he works
with now. It is read, never edited here. If it cannot be read, say so in a line and propose no
outdated situation.

Then go topic by topic: the topic Angelo named, or each top-level tag of `aletheia tag list`
in turn (those without `::`). For each topic:

```sh
aletheia card list <tags> --content
```

It prints each card with `id`, `question`, `keyPoints`, `situation` and its progress. Read
every card of the topic, and skip a card that the `kept` list of `aletheia card candidates`
names for the same reason: Angelo kept it in the last six months, or the months he set.

- **An outdated situation**: the card's situation is about work Angelo no longer does, by his
  profile. Quote the situation and the line of the profile it contradicts. Offer: archive it,
  rewrite the situation in place (section 2, same knowledge only), keep it
  (`aletheia card keep <id> --reason outdated-situation`), or leave it.
- **An overlap**: two cards ask nearly the same. Quote both questions. Search the deck for its
  overlaps in other topics too:

  ```sh
  aletheia card search <<'JSON'
  {"words":"consumer group reparte mensajes XREADGROUP","tags":["messaging::redis-streams"]}
  JSON
  ```

  Offer first to merge them: one draft that states the concept without naming a technology,
  with an example in each, following the quality rules (one idea, an answer of one to three
  lines), saved as in "Replace, split or merge" (section 2). Or keep both, recorded on one of
  them (`aletheia card keep 9p3x --reason overlapping --overlaps w2ab`); archive one of them,
  with his reason; or leave them, which records nothing and brings them back at the next
  prune.

One card or pair at a time, waiting for Angelo after each. When a topic is done, ask whether
to go on with the next one, and stop when he says so.

## 4. The thresholds ("pon el leech en 6 fallos")

Two settings shape the candidates: `leech-failures` (3) and `keep-months` (6). When Angelo asks
to change one, show the exact command and run it only after he approves:

```sh
aletheia settings set --leech-failures 6
```

`default` brings back the built-in value (`--keep-months default`). `aletheia settings show`
prints every setting and whether it is the default.
