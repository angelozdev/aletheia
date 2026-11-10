---
name: aletheia-review
description: Use when Angelo wants to review his Aletheia cards in this repo. Triggers on "repasemos", "vamos a repasar", "¿qué tengo para hoy?", "toca repasar", "hagamos el repaso". Asks one due question at a time, grades his answer Again, Hard, Good or Easy against the card's key points, waits for him after every grade, and records his final grade through the installed aletheia CLI.
---

# aletheia-review

A review session over the cards due now, in Angelo's real deck. Talk to Angelo in Spanish.
The `aletheia` CLI holds the facts (what is due, when it comes back); you hold the judgment
(the grade and why).

## Rules

- Every question about a card or about what is due is answered by running `aletheia`, never
  from memory or from earlier in the session.
- The CLI is the only writer. Never open, read or edit a store file, never write SQL, never
  choose an environment: plain `aletheia` is the real deck.
- Instants come in Angelo's local time with their offset (`2026-11-11T10:00:00-05:00`). Read
  them as printed; never convert a time zone.

## 1. Ask what is due

```sh
aletheia review due
```

It prints `count`, `nextDue` and `cards`, already in the order to study them. Each card has
`id`, `type`, `tags`, `question`, `keyPoints` and `answer`.

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
lesson, and the grade does not change. Show the next question only when he says so ("sigue",
"la siguiente"); if his reply was already "sigue", go straight on.

## 6. Until nothing is due

When the list runs out, run `aletheia review due` again: a card graded Again comes back within
minutes, while nothing else is due. Go on until it answers `count: 0`, or until Angelo stops.
Then tell him when the next card comes, from `nextDue`. If he asks when a card comes back, run
`aletheia card show <id>` and read its `due` as printed.
