# Quickstart: Capture and Review

How Angelo checks slice 1 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); tables and rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 0 released: `aletheia --version` answers from any directory.
- On the feature branch, `pnpm install` and `pnpm check` green.

## 1. Capture by hand, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia card add <<'JSON'
[{
  "type": "command",
  "question": "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?",
  "answer": "`ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.",
  "keyPoints": ["`ps`: solo en ejecución", "`-a`: incluye detenidos"],
  "situation": "Un contenedor se cayó y no aparece en `docker ps`.",
  "tags": ["docker::commands"],
  "source": "quickstart"
}]
JSON
# stderr: env: test (and, the first time, migrated: …)   stdout: ids[1]: <id>
pnpm aletheia card show <id>      # every field, exactly as written; state: new
```

Refusals, each with exit 1 and nothing stored: drop `situation`; give four `keyPoints`; use
the tag `Docker` or `mensajería`; send `not json`.

## 2. Review by hand, in `test`

```sh
pnpm aletheia review due          # count: 1, the card with its answer and key points
pnpm aletheia review grade <<'JSON'
{"card":"<id>","grade":"again","claudeGrade":"again","answer":"no me acuerdo","rationale":"No la sabía."}
JSON
# state: learning, due in 10 minutes
pnpm aletheia review due          # the card is back: nothing else is due and its step ends within 20 minutes
```

Grade it `good` next: `state: review`, due tomorrow, and `review due` answers `count: 0` with
`nextDue`. A new card graded `good` at once leaves the day without coming back.

## 3. Nothing is deleted (INV-02)

`pnpm test -t INV-02` shows the store refusing to delete a card, to delete a review and to
change a review. No command of the CLI does any of the three.

## 4. Release and the one-time link

On `main`, after merging, with a clean tree:

```sh
pnpm release
# release: <version> (<commit>) installed
# release: skill az-aletheia-add copied to /Users/angelozdev/.aletheia/skills/az-aletheia-add
ln -s ~/.aletheia/skills/az-aletheia-add ~/.claude/skills/az-aletheia-add   # once, ever
aletheia review due               # env: prod; backup: … (before migrating); migrated: …; count: 0
```

The first `aletheia` in `prod` after this release backs the store up and applies the two
migrations.

## 5. The slice, as Angelo uses it (SC-001, SC-002, SC-004)

1. In another repo, after talking a topic through, say "guarda esto". Approve one draft.
   Time it from the phrase to the saved id: under 2 minutes.
2. Ask "muéstrame esa tarjeta": Claude runs `aletheia card show`.
3. In `~/me/aletheia`, say "repasemos". Answer; accept or dispute the grade; ask a doubt; say
   "sigue". Ask when the card comes back: Claude runs the CLI and reads the date as printed.

No command and no `/` typed in any of the three.

## Measures

Taken after the release, on Angelo's Mac.

| Criterion | Command | Result | Limit |
|-----------|---------|--------|-------|
| SC-002 | "guarda esto" to a saved id | | 2 min |
| SC-003 | `review due`, `card show`, `card add` and `review grade` on a temp store with 1,000 cards (`ALETHEIA_DB`) | 2026-11-09, from the sources: `pnpm aletheia` 0.86–0.90 s each (about 0.4 s of it is pnpm's own start); `node src/shell/cli/bin/bin.ts` about 0.48 s each | 1 s each |
| SC-004 | a review of 10 due cards: inputs beyond answers, disputes, doubts and "sigue" | | 0 |
