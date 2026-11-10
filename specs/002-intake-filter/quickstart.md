# Quickstart: Intake Filter

How Angelo checks slice 2 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); rules follow [data-model.md](./data-model.md).

## Prerequisites

- Slice 1 released and in use: `aletheia review due` answers from any directory.
- On the feature branch, `pnpm install` and `pnpm check` green.
- `~/me/aletheia/PROFILE.md` written and approved (delivery step 4); `git status` does not list it.

## 1. Search by hand, in `test`

With the Docker card of slice 1's quickstart §1 saved in `test`:

```sh
cd ~/me/aletheia
pnpm aletheia card search <<'JSON'
{ "words": "contenedores detenidos docker ps", "tags": ["docker"] }
JSON
```

Expected: the Docker card, first. Then check each of these:

- `{ "words": "Contenedor" }` finds it as well: singular for plural, case ignored.
- `{ "words": "¿qué es esto?" }` gives `cards: []`: only common words.
- `` { "words": "`docker` \"ps\" (NOT -a) *" } `` answers without error.
- `{}` and `{ "tags": ["Docker"] }` exit 1 with the messages of the contract.

## 2. A duplicate flagged, in `prod`, after the release

Angelo runs `pnpm release` from a clean `main` after the merge. Then, in another repo
(`diarium`), talk about `docker ps -a` for a minute and say "guarda esto".

Expected: the draft shows `⚠ duplica a #<id>` naming the Docker card in the deck. Reject it.

## 3. Junk flagged by the profile

Still in another repo: ask what `useState` returns and in which year Docker came out, then say
"guarda esto".

Expected: one draft flagged `ya lo sabes por tu perfil`, the other `trivia`, each with its reason.
Both are shown; reject both and nothing is saved.

## 4. The profile kept current

In `~/me/aletheia`, say "repasemos" and, while answering, mention "en el trabajo uso Terraform a
diario".

Expected: Claude's next reply ends with `¿Anoto en tu perfil: «…»?` and the review goes on. Say
yes, check the new line in `PROFILE.md`, then in another repo discuss what `terraform plan` does,
say "guarda esto" and see the draft flagged `ya lo sabes por tu perfil`.

## Measures

Filled in by Angelo after two weeks of use (SC-002), and once for SC-001, SC-003 and SC-004.

| Criterion | Measure | Result |
|---|---|---|
| SC-001 | duplicate and profile/trivia flags seen in `prod` on release day | |
| SC-002 | rejected drafts (duplicate, known, trivia) that had been flagged with that reason, of all such rejections | |
| SC-003 | "guarda esto" to saved cards, with searches | |
| SC-004 | `card search` on 1,000 cards (`time`, a scratch store) | |
