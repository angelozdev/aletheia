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

Both lists print `count`, `nextDue` and `cards`, already in the order to study them. Each card
has `id`, `type`, `tags`, `question`, `keyPoints` and `answer`. A topic's cards are reviewed
like due cards, through sections 2 to 6, even those not due yet.

With `count: 0`, tell Angelo there is nothing to review and when the next card comes, from
`nextDue` (`null` means the deck is empty). Stop there.

## 2. One question at a time

Show the next card's question, with its type and tags, and nothing else: never its answer and
never its key points. Refer to the card as `#<id>`. Angelo answers in his own words.

## 3. Grade the answer

Check the answer against the card's key points and the rule of its type:

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
missing), and the card's full answer. Then **stop and wait** for Angelo, after every grade,
whatever it was. He may have doubts about a card he got right.

## 4. Settle and record the grade

His reply settles the grade, which is then recorded once:

- **A dispute** ("eso era Good", "creo que merece Easy"): his grade is the final one. Say in a
  line if you see it differently, but record his.
- **A doubt or "sigue"**: your grade stands.

Record it with the card's id without `#`, through a quoted heredoc:

```sh
aletheia review grade <<'JSON'
{"card":"k7m2","grade":"easy","claudeGrade":"good","answer":"ps muestra los que corren, -a todos","rationale":"Cubre los dos key points, sin dudar."}
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

When the list runs out, run the same command again (`aletheia review due`, or `aletheia review
topic` with the same tags): a card graded Again comes back within minutes, while nothing else
is due. Go on until it answers `count: 0`, or until Angelo stops.
Then tell him when the next card comes, from `nextDue`. If he asks when a card comes back, run
`aletheia card show <id>` and read its `due` as printed.

## Keep the profile current

Only while this skill runs, listen for Angelo stating his own level: "uso Terraform a diario",
"nunca he tocado Kubernetes".
Only explicit statements count: never a grade, a streak of Easy, or your guess.

When he states one, end your next reply with one line offering the change, without holding
back the question or the grade:

- `¿Anoto en tu perfil: «<línea>»?` when no line covers that area;
- `¿Cambio en tu perfil «<antes>» por «<después>»?` when a line already covers it, or says
  something else ("ya domino Lambda" against "estudiando AWS"): change that line, never add a
  second one.

The profile is `~/me/aletheia/PROFILE.md`, one bullet per area in Spanish
(`- **Terraform**: uso diario.`). Edit it only after Angelo approves that exact line, and touch
nothing else in it. If he ignores the offer or says no, drop it and do not offer it again.
