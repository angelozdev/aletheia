# Quickstart: Varied Questions

How Angelo checks slice 5 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 4 released and in use: `aletheia review due` answers from any directory.
- On the feature branch, `pnpm install`, and `pnpm check` green.
- In `test`, at least two cards due (`pnpm aletheia review due`).

## 1. The question as asked, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia review grade <<'JSON'
{"card":"<id>","grade":"good","claudeGrade":"good","answer":"x","rationale":"y","askedQuestion":"<la pregunta con otras palabras>"}
JSON
pnpm aletheia card show <id>
```

Expected: the grade is recorded, and `card show` prints the stored `question`, not the asked
one. Then check that the same grade without `askedQuestion`, or with `"askedQuestion":"  "`,
exits 1 with `invalid review: askedQuestion: is required` and records nothing.

## 2. A bad rephrasing, in `test`

Note another due card's `due` and `state` with `pnpm aletheia card show <id>`, then grade it
`good` with `"flag":"badly-rephrased"` and an `askedQuestion`:

```sh
pnpm aletheia card show <id>
pnpm aletheia review due
```

Expected: the same `due`, `state`, `reps` and `lapses` as before the grade; the card is not in
the list, and `nextDue` is no later than tomorrow.

## 3. In `prod`, after the release

The release backs up `prod` before migrating it. In a new Claude Code session in this repo,
"repasemos":

- A card you have reviewed before comes back worded differently, without your asking, and its
  grade follows the stored key points (SC-001).
- Say "pregúntamela como está": that card is asked as stored, and the next one is rephrased
  again.
- When a rephrasing misleads you, say so: Claude voids the review as a bad rephrasing, proposes
  no rewrite, and the card does not come back today.

## Measures

- SC-001: §3's first point, the day of the release.
- SC-002: Angelo, over the first two weeks of real reviews: at most 1 review in 20 voided as a
  bad rephrasing.
- SC-003: the CLI refuses a review without its question (005-US1-AS2), so it holds by
  construction.
- SC-004: the CLI tests of 005-US2-AS1 and AS2, and `card show` on any card voided this way in
  `prod`.
