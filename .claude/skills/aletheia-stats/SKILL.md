---
name: aletheia-stats
description: Use when Angelo asks how his Aletheia deck is going, in this repo. Triggers on "¿cómo voy?", "¿qué tengo flojo?", "¿qué no repaso hace un mes?", "¿qué fallé esta semana?", "muéstrame mi progreso", "¿cuál va peor?". Answers every progress question from what the installed aletheia CLI prints in that turn, says what the numbers mean, and writes nothing.
---

# aletheia-stats

Angelo's progress in his real deck: how each topic is going. Talk to Angelo in Spanish.
The `aletheia` CLI computes every number (cards, retention, weak cards, gaps); you pick the
query that answers his question and say what its numbers mean.

## Rules

- Every progress question is answered by running `aletheia` in that turn, never from memory or
  from earlier in the session, even when you printed the same numbers a minute ago.
- Every number you state is one the CLI printed in that turn. Never count, add up or estimate
  numbers yourself.
- You only read: `aletheia tag stats`, `aletheia tag list`, `aletheia card list` and
  `aletheia review history`. This skill writes nothing to the deck: no card, no grade, no
  setting.
- Never open, read or edit a store file, never write SQL, never choose an environment: plain
  `aletheia` is the real deck.
- Instants come in Angelo's local time with their offset (`2026-11-11T10:00:00-05:00`). Read
  them as printed; never convert a time zone.

## 1. How each topic is going ("¿cómo voy?")

```sh
aletheia tag stats
```

It prints `deck`, the whole deck, then `tags`: one row per tag in use and each of its
ancestors, in tag order, so a child follows its parent. Each row has:

- `cards`: active cards under it, each once.
- `new`: of them, cards never seen.
- `due`: of them, cards already seen and due before today ends.
- `retention`: the share passed (Hard, Good or Easy) of the reviews of cards already learned in
  the last 30 days, as a whole percent. `null` means "sin repasos que cuenten aún", never 0%.
- `weak`: cards with 3 failures or more, ever.
- `gaps`: reviews flagged `missing-prerequisite` in the last 30 days.

`deck` also has `candidates`: how many cards the CLI proposes to prune, leeches and cards
Angelo said were useless in a review.

Lead with the deck in a line (cards, due today, retention), then only the topics worth a
remark: low retention, weak cards, gaps, many due. Not every row. When `candidates` is above 0,
end with it in a line, "hay 2 para podar", and offer "podemos el mazo"; `aletheia-prune` takes
it from there.

The first time `weak` or `gaps` appear in the conversation, say in a line what they mean:

- A weak card has 3 failures or more (Again on a card already learned, not voided, not flagged
  `missing-prerequisite`). It is usually badly written or holds two ideas.
- A gap is a review flagged `missing-prerequisite` in the last 30 days: the card failed for a
  base concept it lacked. A topic with gaps lacks a base, which is not the same as a weak topic.

`aletheia tag list` prints only the tags in use and their cards, when that is all he asks.

### A topic ("¿y de mensajería?")

For a topic named in Spanish, list the tags in use first:

```sh
aletheia tag list
```

Pick every tag that covers the topic; a topic can span branches ("redis" →
`messaging::redis-streams` and `databases::redis`). Then narrow the tree to them, descendants
included:

```sh
aletheia tag stats <tags>
aletheia tag stats messaging::redis-streams databases::redis
```

`deck` then covers only the cards under those tags. When no tag covers the topic, say so and
name the top-level tags (those without `::`) from the list. Never guess a tag.

### A sort ("¿cuál va peor?")

`--sort <field>` orders siblings under their parent by a field as printed (`tag`, `cards`,
`new`, `due`, `retention`, `weak` or `gaps`), lowest first; `--desc` reverses it. Each row
still follows its parent, and a `null` retention is always last.

- "¿cuál va peor?": `aletheia tag stats --sort retention`, worst first.
- "¿dónde tengo más flojas?": `aletheia tag stats --sort weak --desc`.
- "¿dónde tengo más pendientes?": `aletheia tag stats --sort due --desc`.

Both combine: `aletheia tag stats messaging --sort retention`.

## 2. Which cards ("¿qué tengo flojo de mensajería?")

When Angelo asks for the cards behind a number, list them:

```sh
aletheia card list <tags> --weak --sort failures --desc
```

It prints `cards`, each with `id`, `question` (as stored), `tags`, `state`, `due`,
`lastReview` (`null` if never reviewed), `failures`, `gaps` and `weak`. Without tags it covers
the whole deck; tags work as in `aletheia tag stats`. The filters combine, and a card must
match all of them:

- `--weak`: only weak cards.
- `--gaps`: only cards with a gap in the last 30 days.
- `--not-reviewed <days>`: only cards with no review in that many days, counting today;
  a card never reviewed is included when it was saved before them.

`--sort <field>` takes `id`, `state`, `due`, `lastReview`, `failures` or `gaps`, by
`lastReview` when none is given (oldest first, never reviewed last); `--desc` reverses it.

- "¿qué tengo flojo de <tema>?": `aletheia card list <tags> --weak --sort failures --desc`,
  the tags found as in section 1.
- "¿qué no repaso hace un mes?": `aletheia card list --not-reviewed 30`.
- "¿dónde tengo huecos?": `aletheia card list --gaps`.

Quote each card by its id and its stored question (`#k7m2: En Redis Streams, ¿cómo…?`), with
the numbers that answer the question. `cards: []` means none matches; say so.

When no query answers the question ("¿qué tarjeta me costó más tiempo?"), say that the CLI does
not keep that, and stop. Never estimate it or answer from what you remember of the session.

## 3. How the reviews went ("¿qué fallé esta semana?")

Questions about past reviews are read from the log:

```sh
aletheia review history --days 7 --grade again
```

It prints `counts` (`reviews`; `grades`, one per grade; `flags`, one per flag; `disputed`, the
reviews where Angelo's grade differs from yours) and `reviews`, newest first, each with `card`,
`reviewedAt`, `grade`, `claudeGrade`, `flag` and `askedQuestion` (the question as you asked
it; `null` for reviews before questions were rephrased). Tags narrow it as in section 1.

- `--days <n>`: the last n days, counting today; 7 when not given. "hoy" is `--days 1`,
  "esta semana" `--days 7`, "estas dos semanas" `--days 14`.
- `--grade <grade>`: only reviews Angelo graded `again`, `hard`, `good` or `easy`.
- `--flag <flag>`: only reviews flagged `missing-prerequisite`, `badly-written` or
  `badly-rephrased`.

The counts cover the reviews listed, after every filter.

- "¿qué fallé esta semana?": `aletheia review history --days 7 --grade again`; give each Again
  with its card and the question as asked.
- "¿cuántos repasos anulaste por reformulación estas dos semanas?": run
  `aletheia review history --days 14 --flag badly-rephrased` and
  `aletheia review history --days 14`, and give the first `counts.reviews` out of the second's.
- "¿en cuántos te discutí la nota?": `disputed` from `aletheia review history --days <n>`.

Always quote the counts the CLI prints; never count the rows yourself.

## 4. Studying what is weak

This skill does not review. When Angelo wants to study a topic, offer "repasemos <tema>" with
the topic in Spanish; `aletheia-review` takes it from there.
