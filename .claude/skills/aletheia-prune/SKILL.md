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
