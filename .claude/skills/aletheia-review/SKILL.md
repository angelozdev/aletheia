---
name: aletheia-review
description: Use when Angelo wants to review his Aletheia cards in this repo. Triggers on "repasemos", "repasemos <tema>", "vamos a repasar", "¿qué tengo para hoy?", "toca repasar", "hagamos el repaso". Asks one due question at a time, or one of a topic he names, grades his answer Again, Hard, Good or Easy against the card's key points, waits for him after every grade, and records his final grade through the installed aletheia CLI.
---

# aletheia-review

A review session over the cards due now, or over a topic Angelo names, in his real deck. Talk to Angelo in Spanish.
The `aletheia` CLI holds the facts (what is due, when it comes back); you hold the judgment
(the grade and why).

## Rules

- Every question about a card or about what is due is answered by running `aletheia`, never
  from memory or from earlier in the session.
- The CLI is the only writer. Never open, read or edit a store file, never write SQL, never
  choose an environment: plain `aletheia` is the real deck.
- Instants come in Angelo's local time with their offset (`2026-11-11T10:00:00-05:00`). Read
  them as printed; never convert a time zone.

## 1. Ask what is due, or a topic

For a general review ("repasemos", "¿qué tengo para hoy?"):

```sh
aletheia review due
```

For a topic ("repasemos mensajería", "repasemos redis"), list the tags in use first:

```sh
aletheia tag list
```

It prints each tag with its ancestors and how many active cards it covers. Pick every tag that
covers the topic Angelo named; a topic can span branches ("redis" → `messaging::redis-streams`
and `databases::redis`). Then ask for the cards under them, descendants included:

```sh
aletheia review topic messaging::redis-streams databases::redis
```

When no tag covers the topic, say so and name the top-level tags (those without `::`) from the
list, so he can pick one. Never guess a tag, and never fall back to the general review.

Both lists print `session`, `count`, `remaining`, `heldBack`, `capReached`, `nextDue` and
`cards`, already in the order to study them. Each card has `id`, `type`, `tags`, `question`,
`keyPoints` and `answer`. A topic's cards are reviewed like due cards, through sections 2 to 6,
even those not due yet.

### The session

A session holds at most its size, 20 unless Angelo saved another (see "Limits that stay"). The
first list of a round prints `session`, the instant it
began. Keep it, and pass it on every later list call of that round, with the same command and
tags:

```sh
aletheia review due --session 2026-11-10T10:00:00-05:00
```

When Angelo names a size for this review ("hoy solo 10"), pass `--session-size 10` on every
call of the round, the first one included. If you lose `session` (after a `/compact`), call
without `--session`: that starts a new round.

### New cards per day

A general review introduces at most 10 new cards per local day, unless Angelo saved another
limit; a topic review is not limited.
With `heldBack` above 0, say in a line how many new cards wait for tomorrow. When Angelo asks
for more for this review ("hoy dame 20 nuevas"), pass `--new-per-day 20` on every call of the
round.

Each session keeps a share of its places for new cards, 10 % unless Angelo saved another, so a backlog of
reviews never holds them all back. When Angelo names a share for this review ("hoy la mitad
nuevas"), pass `--new-share 50` on every call of the round.

With `count: 0`, tell Angelo there is nothing to review and when the next card comes, from
`nextDue` (`null` means the deck is empty); with `heldBack` above 0, say also how many new cards
wait for tomorrow. Stop there.

## 2. One question at a time

Show the next card's question, rephrased, with its type and tags, and nothing else: never its
answer and never its key points. Refer to the card as `#<id>`. Angelo answers in his own words.

Rephrase every question, so Angelo recalls the concept instead of recognizing a sentence he has
read before:

- The rephrasing asks for the same key points as the stored question, and
  names the technology and the variant as the stored question does.
- Keep code, commands and their flags verbatim; only the words around them change.
- Give no hint the stored question does not give, and never part of the answer.
- Word it differently from the stored question and from any wording asked
  earlier in this session, a card shown again in it included.
- A prerequisite and a topic's cards are rephrased like any other. After a rewrite
  (`aletheia card edit`), start from the new stored question.

Ask it as stored when no rewording keeps what it asks, or when Angelo asks for it
("pregúntamela como está"); rephrase again from the next card. When Angelo does not understand
a rephrasing ("¿responde cómo?"), reword it before he answers. The last wording before he
answered is the question as asked, which you record (section 4).

## 3. Grade the answer

Check the answer against the stored key points, never against your rephrased wording, and the
rule of the card's type:

| type | What counts |
|---|---|
| `concept` | the key points are present |
| `comparison` | the criterion is right; exact wording does not matter |
| `command` | equivalent commands count (`docker ps -a` = `docker container ls --all`) |
| `scenario` | the concept is applied to the situation |
| `code` | the result and the reasoning behind it |

Then give one of four grades, never a number or a score:

- **Again**: did not know, a fundamental error, or the base concept is missing.
- **Hard**: partial; an important key point is missing.
- **Good**: every key point, essentially correct.
- **Easy**: every key point, precise, with no hedging ("creo que…", "¿era…?").

No timing signal: how long the answer took says nothing in a chat.

Show the grade, the reason in one or two lines (which key points were there, which were
missing), and the card's full answer as stored, never rephrased. Then **stop and wait** for Angelo, after every grade,
whatever it was. He may have doubts about a card he got right.

## 4. Settle and record the grade

His reply settles the grade, which is then recorded once:

- **A dispute** ("eso era Good", "creo que merece Easy"): his grade is the final one. Say in a
  line if you see it differently, but record his.
- **A doubt or "sigue"**: your grade stands.

Record it with the card's id without `#`, through a quoted heredoc:

```sh
aletheia review grade <<'JSON'
{"card":"k7m2","grade":"easy","claudeGrade":"good","answer":"ps muestra los que corren, -a todos","rationale":"Cubre los dos key points, sin dudar.","askedQuestion":"Si corres `docker ps` y luego `docker ps -a`, ¿qué contenedores añade el segundo?"}
JSON
```

- `grade`: the final grade, after any dispute.
- `claudeGrade`: the grade you gave first, before any dispute.
- `answer`: a summary of Angelo's answer, never his words as typed or dictated. In one to
  three lines of Spanish, keep every claim he made, right or wrong, and any part he said he
  did not know. Drop filler, repetitions, false starts and hedges ("no estoy seguro",
  "creo que"); if hedging weighed on the grade, say so in the rationale. His doubts and
  questions after the grade are not part of the answer.
- `rationale`: your reason, in Spanish.
- `askedQuestion`: the question exactly as you asked it, the last wording before Angelo
  answered; the stored one when you asked it as stored.

For example, Angelo answered #5ks0 (VM vs. container) with "no estoy así 100% seguro pero la
máquina virtual contiene el sistema operativo, el kernel y las aplicaciones que van encima
mientras que el contenedor no, el contenedor no sé qué cosas tiene pero no tiene el sistema
operativo dentro y por lo mismo tampoco tiene kernel entonces pero no sé exactamente que tiene
el contenedor para comunicarse con con el kernel". The `answer` to record is "La VM trae SO,
kernel y aplicaciones; el contenedor no trae SO ni kernel. No sabe qué trae el contenedor ni
cómo usa el kernel del host."

The JSON must be valid: escape `"` and `\` inside strings and write line breaks as `\n`.
stdout gives `card`, `grade`, `state` and `due`, the instant the card comes back. If it exits
1, nothing was recorded: read the `error:` line, fix the JSON and send it again.

### A missing base concept

When Angelo's answer shows that a concept the card rests on is missing ("no recuerdo qué es un
consumer group"), the grade is Again. Once his reply settles it, record it with the flag:

```sh
aletheia review grade <<'JSON'
{"card":"k7m2","grade":"again","claudeGrade":"again","answer":"No recuerda qué es un consumer group.","rationale":"Le falta el concepto base: qué es un consumer group.","askedQuestion":"Tienes dos workers leyendo el mismo stream de Redis con un consumer group: ¿cómo se reparten los mensajes?","flag":"missing-prerequisite"}
JSON
```

The flag goes only with a final grade of Again: if Angelo disputes it into another grade,
record his grade without the flag.

Then look in the deck for a card that covers the concept:

```sh
aletheia card search <<'JSON'
{"words":"consumer group grupo de consumidores XREADGROUP","tags":["messaging::redis-streams"]}
JSON
```

- `words`: the concept, with its synonyms in Spanish and English.
- `tags`: the failed card's tags.

Read every card listed and judge whether one covers the concept; sharing a word or a tag is
not enough. A card listed with `status: archived` is not asked: Angelo retired it, and the
CLI refuses to grade it.

- **One covers it and was not shown in this session**: ask it next, before explaining
  anything. Its answer is the explanation, and its grade shows what Angelo remembers, even if
  it was graded earlier today. Review it through sections 2 to 4, and record its grade with
  the id of the failed card:

  ```sh
  aletheia review grade <<'JSON'
  {"card":"c4gr","grade":"good","claudeGrade":"good","answer":"Un consumer group reparte los mensajes de un stream entre sus consumidores.","rationale":"Cubre los dos key points.","askedQuestion":"En Redis Streams, ¿qué hace un consumer group con los mensajes de un stream?","prerequisiteOf":"k7m2"}
  JSON
  ```

  It takes no place in the session and does not count toward the day's new cards; the CLI
  counts that, not you.
- **Otherwise** (no card covers it, or the one that does was already shown in this session):
  explain the concept in two or three lines, no lesson, and offer the card in a line: "No hay
  una tarjeta sobre qué es un consumer group. ¿La agregamos?". If he says yes, use the
  `az-aletheia-add` skill for that idea, with the source `repaso #<id>` of the failed card. A
  card created this way is not asked in this session: Angelo read its answer when approving
  it.

Ask at most one prerequisite per failed card. A prerequisite that fails for a missing base concept too is
graded Again with the flag and explained in two or three lines, and pulls nothing more: a
review is not a lesson. Then go on with the list; the failed card comes back before the
session ends, like any Again.

### The wording decided it

Sometimes the wording, not Angelo's memory, decided the answer, right or wrong: the question
can be read two ways, lacks context it should carry, asks something other than its key points,
or gives its answer away. Grade the answer as usual, then tell which wording decided it:

- **If only your rephrasing decided it**, say so in a line with the grade ("mi reformulación
  quitó el `ack`, así que se leía como otra cosa"). Once his reply settles it, record it with
  the flag `badly-rephrased`, and propose no rewrite: the stored card is fine.

  ```sh
  aletheia review grade <<'JSON'
  {"card":"9p3x","grade":"again","claudeGrade":"again","answer":"Habla de la respuesta HTTP del consumidor.","rationale":"Mi reformulación quitó el ack y se leyó como otra cosa.","askedQuestion":"¿Qué le pasa al mensaje cuando el consumidor responde?","flag":"badly-rephrased"}
  JSON
  ```

- **If the stored wording would have decided it too**, say why in a line with the grade ("la
  pregunta no dice si la cola es clásica o quorum, así que tu respuesta vale para las dos").
  Once his reply settles it, record it with the flag `badly-written`:

  ```sh
  aletheia review grade <<'JSON'
  {"card":"9p3x","grade":"again","claudeGrade":"again","answer":"Dice que el mensaje se queda en la cola tras el ack.","rationale":"La pregunta se lee de dos formas: no dice si la cola es clásica o quorum.","askedQuestion":"Cuando el consumidor hace `ack` de un mensaje, ¿qué pasa con él?","flag":"badly-written"}
  JSON
  ```

  Then propose a rewrite of the card (see "A rewrite").

Both flags void the review: the card keeps its schedule and comes back tomorrow at the
earliest, not today, in this session or the next. Its printed `due` is the old one; never read
it as when the card comes back.

Angelo may dispute either flag ("no, la pregunta está bien"), or ask for one ("esa pregunta
está mal escrita", "esa la reformulaste mal"), as he disputes a grade; his word is final, and
the review is recorded with the flag he says, or without one.

### A rewrite

After a review voided as `badly-written`, or when Angelo asks for one ("la pregunta de #9p3x
se entiende mal"), propose a rewrite only when the card still asks for the same knowledge: a
clearer question, a
tidier answer or key points of the same meaning, adjusted tags, situation or type. It follows
the card rules of the `az-aletheia-add` skill.

Every rewrite lists the tags in use first, in that turn, since an earlier rewrite may have
added one:

```sh
aletheia tag list
```

Then give the card one tag for each topic it rests on, by those rules, adding any it lacks. A
tag the list did not print is marked `(nuevo)` in the before and after, and sent without the
mark.

When Angelo asks for an example ("dame un ejemplo en código"), or the rewrite drafts a new
answer for a card with something to run, the answer gets one by rule 8 and "The example" of
the `az-aletheia-add` skill. Check it before showing the before and after, and put its check
line under the `answer` field's header. Otherwise an old card keeps its answer.

Show the exact before and after of every field that changes, and nothing else:

```
#9p3x · question
  antes:   ¿Qué pasa con un mensaje después del ack?
  después: En una cola clásica de RabbitMQ, ¿qué pasa con un mensaje después de que el consumidor lo confirma con `ack`?
#9p3x · tags
  antes:   messaging
  después: messaging, messaging::rabbitmq (nuevo)
```

Run `aletheia card edit` only after Angelo approves, with his edits, sending `card` and the
changed fields only:

```sh
aletheia card edit <<'JSON'
{"card":"9p3x","question":"En una cola clásica de RabbitMQ, ¿qué pasa con un mensaje después de que el consumidor lo confirma con `ack`?","tags":["messaging","messaging::rabbitmq"]}
JSON
```

It prints the card with every field; read it back in a line. The card keeps its id, its
schedule and its reviews. If it exits 1, nothing changed: read the `error:` line, fix the JSON
and send it again.

A rewrite does not change the grade being settled, and a voided review stays voided.

### A replacement

When the fix would change what the key points mean, or the card holds two ideas, offer to
replace it, or to split it into one card per idea, after the grade is recorded. Draft the new
cards by the card rules of the `az-aletheia-add` skill, their tags listed as for a rewrite,
with `aletheia tag list` in that turn, and their examples checked as for a rewrite. Show the
old card and each draft with every field. Ask his why in his words if he has not said it: it
goes in the old card's archive reason. Only after Angelo approves the exact drafts, with his
edits, and gives his why, save them in one call, their `source` naming the old card:

```sh
aletheia card add <<'JSON'
[
  {
    "type": "concept",
    "question": "En Redis Streams, ¿qué quita `XACK` y qué deja intacto?",
    "answer": "Quita el mensaje de la lista de pendientes (PEL) del consumer group; el mensaje sigue en el stream hasta `XDEL` o un recorte con `XTRIM`.",
    "keyPoints": ["quita el mensaje de la PEL", "el mensaje sigue en el stream", "se borra con `XDEL` o `XTRIM`"],
    "situation": "Tras confirmar los mensajes con `XACK`, el stream sigue creciendo.",
    "tags": ["messaging::redis-streams"],
    "source": "reemplaza a #m4cd"
  }
]
JSON
```

Read the ids it prints (`ids[1]: d6q1`), then archive the old card, the id without `#`, the
reason `reemplazada por #<id>[, #<id>…]: <his why>`:

```sh
aletheia card archive <<'JSON'
{"card":"m4cd","reason":"reemplazada por #d6q1: decía que XACK borra el mensaje del stream, y corregirlo cambia la pregunta"}
JSON
```

If `aletheia card add` exits 1, nothing was saved: read the `error:` line, fix the JSON and
send it again. If the archive exits 1 after the save, say that the old card is still active
beside the new one, fix the JSON and archive it again; never send the drafts a second time.
The new cards are new: they may come up in this session if the day's new cards allow it. Say
so in a line.

### A card that adds nothing

When Angelo says a card adds nothing to him ("esto no me sirve", "esto lo sé de memoria",
"nunca uso esto"), grade his answer as usual, then record the review with the flag
`not-useful`; quote his words in the rationale:

```sh
aletheia review grade <<'JSON'
{"card":"q3rt","grade":"good","claudeGrade":"good","answer":"ps muestra los que corren, -a también los detenidos.","rationale":"Dijo: \"esto no me sirve, nunca lo uso\". La respuesta cubre los dos puntos.","askedQuestion":"¿Qué contenedores añade `docker ps -a` a lo que lista `docker ps`?","flag":"not-useful"}
JSON
```

The flag changes nothing in the schedule or the stats: the review counts as one without a
flag. Tell him in a line that prune will list it ("lo verás al podar"). This skill never
archives a card for this; `aletheia-prune` does, when he chooses.

A review that already carries a flag (`missing-prerequisite`, `badly-written` or
`badly-rephrased`) keeps its flag: put his words in the rationale, and prune will not list the
card from that review.

## 5. Doubts about the card

After recording, answer each of Angelo's doubts about that card in two or three lines. No
lesson, and the grade does not change.

### A doubt worth a card

Sometimes a doubt shows a gap worth remembering. Offer it as a new card only when all of
these hold:

- it is about what Angelo is learning with this card (its topic, or something it rests on),
  not a tangent;
- it makes one good card by the rules of the `az-aletheia-add` skill: one idea, an answer of
  one to three lines, a credible situation, not trivia;
- no card shown in this session already covers it.

Most doubts make no card. When one does, offer it in a line after your answer, without
drafting it yet: "Esto vale una tarjeta: qué es el userland y qué trae de él un contenedor.
¿La agregamos?". If he says yes, use the `az-aletheia-add` skill for that idea, with the
source `repaso #<id>`: it drafts the card from this conversation, shows it, and saves it only
once Angelo approves it, with his edits. If he says no or lets it pass, drop it and do not
offer it again. Then go back to the review where you left it.

For example, on #5ks0 (VM vs. container) Angelo asked what a userland is, and how a Linux
container on his Mac reaches a kernel to use the machine's resources. Both are worth a card:
what the userland is and what an image like `node:22-alpine` brings of it; and how Docker
Desktop runs Linux containers on macOS, inside a light Linux VM whose kernel they share. A
doubt like "¿y `docker ps` tiene más flags?" is not.

Show the next question only when he says so ("sigue", "la siguiente"); if his reply was
already "sigue", go straight on.

## 6. Until nothing is due

When the list runs out, run the same command again with `--session` (`aletheia review due`, or
`aletheia review topic` with the same tags): a card graded Again comes back within minutes,
while nothing else is due. Go on until it answers `count: 0`, or until Angelo stops.

With `capReached: true`, the session has graded its size. Once its cards run out and
`remaining` is above 0, tell Angelo how many cards remain and ask whether to go on. Go on only
if he says so, with a call without `--session` and without one-session limits: a new round, as
if the session had just started. Otherwise stop there.

When you stop, tell him when the next card comes, from `nextDue`. If he asks when a card comes back, run
`aletheia card show <id>` and read its `due` as printed.

## Limits that stay

Tell a one-session limit from a lasting one by what Angelo says:

- "hoy solo 10", "hoy dame 20 nuevas", or a number for this review: a one-session flag on every
  call of the round (section 1). Nothing is saved.
- "a partir de ahora", "siempre", "de ahora en adelante": a lasting change, saved in the deck.

For a lasting change, show him the exact command before running it, and run it only after he
approves it:

```sh
aletheia settings set --session-size 15 --new-share 20
```

The options are `--session-size`, `--new-per-day` and `--new-share`; `default` goes back to the
built-in value (`aletheia settings set --new-share default`). It prints every setting; read it
back to him in a line. The next lists use it without a flag. If it exits 1, nothing changed:
read the `error:` line and tell him.

When he asks what his limits are, run `aletheia settings show`: each setting, its value, and
whether it is still the built-in default.

## Keep the profile current

Only while this skill runs, listen for Angelo stating his own level: "uso Terraform a diario",
"nunca he tocado Kubernetes".
Only explicit statements count: never a grade, a streak of Easy, or your guess.

Offer a line only for an area's level, his role, or how he learns. A narrow fact inside an area
gets no offer: one crate, one flag, one thing he has or has not done in it («nunca he creado
errores custom» under Rust). The exception is a narrow fact that changes the area's level: then
offer the area's new line in general words, never naming the fact ("ya domino Lambda" against
"estudiando AWS" → `¿Cambio en tu perfil «estudiando AWS» por «uso AWS en proyectos»?`).

When he states one, end your next reply with one line offering the change, without holding
back the question or the grade:

- `¿Anoto en tu perfil: «<línea>»?` when no line covers that area;
- `¿Cambio en tu perfil «<antes>» por «<después>»?` when a line already covers it, or says
  something else ("ya uso Docker a diario" against "Docker: aprendiendo"): change that line,
  never add a second one.

The profile is `~/me/aletheia/PROFILE.md`, one bullet per area in Spanish
(`- **Terraform**: uso diario.`). Edit it only after Angelo approves that exact line, and touch
nothing else in it. If he ignores the offer or says no, drop it and do not offer it again.
