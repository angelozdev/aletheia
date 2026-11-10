# Quickstart: Topic Review

How Angelo checks slice 3 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 2 released and in use: `aletheia review due` answers from any directory.
- On the feature branch, `pnpm install` and `pnpm check` green.
- In `test`, a few cards under `messaging::redis-streams`, `messaging::rabbitmq` and
  `docker::commands`, saved with `pnpm aletheia card add`.

## 1. Tags and a topic, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia tag list
pnpm aletheia review topic messaging
```

Expected: the tree with `messaging` counting both of its children, then the messaging cards
only, none of them due, with `session` printed first. Then check each of these:

- `pnpm aletheia review grade` on one of them answers with a `due` computed from now (an early
  review), and `review topic messaging` no longer lists it today.
- `review topic messaging-legacy`, `review topic Messaging` and `review topic` exit 1 with the
  contract's messages.

## 2. The cap, in `test`

With 25 new cards saved with `card add`, and a daily limit raised so all of them are eligible:

```sh
pnpm aletheia review due --session-size 3 --new-per-day 25
pnpm aletheia review due --session "<the session printed above>" --session-size 3 --new-per-day 25
```

Expected: 3 cards and `remaining: 22`. Grade those 3 (one of them Again), then call again with
the session: `capReached: true`, and only the card graded Again once its step ends.

## 3. New cards, in `test`

Save 12 new cards on a day with none introduced, then:

```sh
pnpm aletheia review due
pnpm aletheia review due --new-share 50 --session-size 4
```

Expected: 10 new cards and `heldBack: 2`. The second call, with reviews due, places new cards
at 2 and 4.

## 4. Settings, in `test`

```sh
pnpm aletheia settings show
pnpm aletheia settings set --session-size 15
pnpm aletheia settings set --session-size 0
pnpm aletheia settings set --session-size default
```

Expected: every setting marked `default: true`; then 15 with `default: false`; then exit 1 with
nothing changed; then back to `default: true`.

## 5. In `prod`, after the release

In a new Claude Code session in this repo:

- "repasemos mensajería": Claude lists the tags, picks `messaging`, shows a card that is not
  due, and records its grade.
- "repasemos" with more than 20 cards due: at the 20th, Claude says how many remain and asks;
  "sigue" brings up to 20 more.
- "a partir de ahora sesiones de 15": Claude shows `aletheia settings set --session-size 15`
  and runs it only after Angelo approves.

## Measures

- SC-001: §5's first point, the day of the release.
- SC-002, SC-003, SC-004, SC-006: Angelo, over the first two weeks of real reviews.
- SC-005: in a scratch store with 1,000 cards (`pnpm aletheia --env perf card add` with a
  generated list), `time pnpm aletheia --env perf tag list` and `review topic <tag>` each
  under 1 s. Then `rm data/perf.sqlite`, which Angelo runs himself.
