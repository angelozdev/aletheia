# Quickstart: Gaps and Rewrites

How Angelo checks slice 4 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 3 released and in use: `aletheia review due` answers from any directory.
- On the feature branch, `pnpm install` and `pnpm check` green.
- In `test`, three new cards saved in this order with `pnpm aletheia card add`: X, how a
  consumer group splits messages in Redis Streams; P, what a consumer group is; Y, any other.

## 1. A gap and its prerequisite, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia review due --session-size 2
```

Grade X Again with `"flag":"missing-prerequisite"`, then P with `"prerequisiteOf":"<X>"`, then
ask the list again with the printed session:

```sh
pnpm aletheia review due --session "<session>" --session-size 2
```

Expected: `capReached: false` and Y in the list, since P counts toward neither cap; once X's
step ends, X comes back as a re-show. Then check:

- `"flag":"missing-prerequisite"` with `"grade":"hard"`, and `"prerequisiteOf"` equal to
  `card`, each exit 1 with the contract's message.

## 2. A voided review, in `test`

Grade a due card with `"flag":"badly-written"`, then:

```sh
pnpm aletheia card show <id>
pnpm aletheia review due
```

Expected: the same `due`, `state`, `reps` and `lapses` as before the grade; the card is not in
the list, and `nextDue` is no later than tomorrow.

## 3. A rewrite, in `test`

```sh
pnpm aletheia card edit <<'JSON'
{"card":"<id>","question":"<nueva pregunta con una palabra nueva>","tags":["messaging::rabbitmq"]}
JSON
pnpm aletheia card search <<'JSON'
{"words":"<la palabra nueva>"}
JSON
```

Expected: the edited card with the same id, `due` and `state`, a new `updatedAt`; the search
finds it. `card edit` with `"source":"x"`, or with only `card`, exits 1.

## 4. In `prod`, after the release

In a new Claude Code session in this repo, "repasemos":

- On a card that rests on another, say "no recuerdo qué es <concepto>": Claude grades Again,
  searches, and asks the card on that concept without explaining first; or, with none,
  explains in two or three lines and offers one.
- On a card whose wording misled you, say so: Claude voids the review, the card does not come
  back today, and Claude proposes the rewrite, saved only after you approve it.

## Measures

- SC-001: §4's first point, the day of the release.
- SC-002, SC-003: Angelo, over the first two weeks of real reviews.
- SC-004: the CLI tests of 004-US2-AS1 and AS2, and `card show` on any card voided in `prod`.
