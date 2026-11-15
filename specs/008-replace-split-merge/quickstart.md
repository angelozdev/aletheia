# Quickstart: Replace, Split and Merge

How Angelo checks slice 8 end to end. No command changes: `card add` follows
[001's contract](../001-capture-and-review/contracts/cli.md) and `card archive`
[007's](../007-prune/contracts/cli.md); the text conventions are in
[data-model.md](./data-model.md).

## Prerequisites

- Slice 7 released: `aletheia card archive --help` prints the archive's usage. Today it does
  not, and the prune and review skills call the installed `aletheia`.
- On the feature branch, `pnpm install`, and `pnpm check` green.
- In `test`, two active cards that ask nearly the same (`pnpm aletheia card list`).

## 1. A merge by hand, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia card add <<'JSON'
[{ "type": "concept", "question": "…", "answer": "…", "keyPoints": ["…"], "situation": "…",
   "tags": ["messaging"], "source": "reemplaza a #<a>, #<b>" }]
JSON
pnpm aletheia card archive <<'JSON'
{ "card": "<a>", "reason": "reemplazada por #<new>: se solapaban" }
JSON
pnpm aletheia card archive <<'JSON'
{ "card": "<b>", "reason": "reemplazada por #<new>: se solapaban" }
JSON
pnpm aletheia card show <new>
pnpm aletheia card search <<'JSON'
{ "words": "<a word of the old questions>" }
JSON
```

Expected: the new card `active`, `state: new`, its source naming both; both old cards
`archived` with the reason; the search lists them archived, with the reason, beside the new one.

## 2. Merge, split and replace through the skills, in `prod`

After the merge to `main` (the local skills read the repo) and slice 7's release:

- "podemos el mazo": at an overlap, choose merge; approve the draft and give the why. Expected:
  one `card add`, then one `card archive` per old card, each shown before it runs.
- At a leech that holds two ideas, choose split. Expected: two drafts, then one archive naming
  both.
- In "repasemos", when a fix would change what a card asks: after the grade, a replacement is
  offered, not "slice 8".

## 3. Merge at capture, in `prod`

After `pnpm release` (Angelo), from another repo, "guarda esto" on something a card already
covers in another technology. Expected: `⚠ se solapa con #…` and the choice to merge. A draft
that repeats a card archived "reemplazada por #…" is judged against the active one, with no
restore offered.

## 4. Measures (two weeks)

- SC-002: every card archived "reemplazada por" shows his why, and none was saved or archived
  without his approval.
- SC-003: `aletheia card search` on each replaced card's words lists its replacement active and
  the old card archived; no pair left both active.
