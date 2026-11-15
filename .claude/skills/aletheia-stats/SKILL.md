---
name: aletheia-stats
description: Use when Angelo asks how his Aletheia deck is going, in this repo. Triggers on "¿cómo voy?", "¿qué tengo flojo?", "¿qué no repaso hace un mes?", "¿qué fallé esta semana?", "muéstrame mi progreso". Answers every progress question from what the installed aletheia CLI prints in that turn, says what the numbers mean, and writes nothing.
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
- You only read: `aletheia tag stats` and `aletheia tag list`. This skill writes nothing to the
  deck: no card, no grade, no setting.
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
- `weak`: cards with 4 failures or more, ever.
- `gaps`: reviews flagged `missing-prerequisite` in the last 30 days.

Lead with the deck in a line (cards, due today, retention), then only the topics worth a
remark: low retention, weak cards, gaps, many due. Not every row.

The first time `weak` or `gaps` appear in the conversation, say in a line what they mean:

- A weak card has 4 failures or more (Again on a card already learned, not voided, not flagged
  `missing-prerequisite`). It is usually badly written or holds two ideas.
- A gap is a review flagged `missing-prerequisite` in the last 30 days: the card failed for a
  base concept it lacked. A topic with gaps lacks a base, which is not the same as a weak topic.

`aletheia tag list` prints only the tags in use and their cards, when that is all he asks.

## 2. Studying what is weak

This skill does not review. When Angelo wants to study a topic, offer "repasemos <tema>" with
the topic in Spanish; `aletheia-review` takes it from there.
