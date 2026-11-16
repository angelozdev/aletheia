# Quickstart: Tags and Code Examples

How Angelo checks slice 9 end to end. No command changes: `card add` follows
[001's contract](../001-capture-and-review/contracts/cli.md), `card search`
[002's](../002-intake-filter/contracts/cli.md), `tag list` [003's](../003-topic-review/contracts/cli.md)
and `card edit` [004's](../004-gaps-and-rewrites/contracts/cli.md); the text conventions are in
[data-model.md](./data-model.md).

The prod steps run in the real deck and profile. Each expected result is on a draft, a before
and after, or an offer: reject the draft or decline the offer unless it is true and wanted.

## Prerequisites

- On the feature branch, `pnpm install`, and `pnpm check` green.
- The toolchains: `command -v rustc cargo node python3` prints four paths. `strace` is absent on
  macOS (expected in §3).
- Live as soon as the file changes, in this repo: the review and prune skills. Live only after
  the merge and `pnpm release` (Angelo): `az-aletheia-add`, and the card rules review and prune
  follow from it (research R2).

## 1. The example is part of the answer, in `test`

```sh
cd ~/me/aletheia
pnpm aletheia tag list
pnpm aletheia card add <<'JSON'
[{ "type": "concept",
   "question": "En Rust, ¿qué hace `.context()` de `anyhow` sobre un `Result`?",
   "answer": "Envuelve el error en un `anyhow::Error` con un mensaje de contexto encima.\n\n```rust\nuse anyhow::{Context, Result};\n\nfn main() -> Result<()> {\n    let texto = std::fs::read_to_string(\"config.toml\").context(\"leyendo la config\")?;\n    println!(\"{texto}\");\n    Ok(())\n}\n```",
   "keyPoints": ["envuelve el error en `anyhow::Error`", "agrega un mensaje de contexto"],
   "situation": "Un error de lectura llega al `main` sin decir qué archivo fallaba.",
   "tags": ["rust::error-handling", "rust::crates::anyhow"], "source": "quickstart 009" }]
JSON
pnpm aletheia card show <id>
pnpm aletheia tag list
pnpm -s vitest run tests/skills tests/traceability
```

Expected: `card show` prints the answer with its block intact, line breaks and backticks
included; the second `tag list` shows `rust::crates::anyhow`; the three test files pass.

## 2. Tags at capture, in `prod`, after the release

From another repo, after studying `anyhow`, say "guarda esto" for `.context()`.

- 009-US1-AS1: Claude runs `aletheia tag list` before drafting; the draft reuses
  `rust::error-handling`, and each tag not in the list carries `(nuevo)`.
- 009-US1-AS2: one of the tags is `rust::crates::anyhow`, beside the subject's tag.

Then a card on `String` vs `&str`:

- 009-US1-AS3: its tags include `rust::ownership`; a topic it only mentions gets no tag.

## 3. Code examples at capture, in `prod`, after the release

- 009-US2-AS1: a card on the `From` trait: the answer gives its lines, then a `rust` block that
  does not count toward them.
- 009-US2-AS2: the draft says `✓ ejemplo comprobado: rustc, exit 0` (or `cargo` for a crate).
  A card on an error such as `"42".parse()` without a type says the example failed with the
  error the card names (E0284).
- 009-US2-AS3: a card on system calls shows them under `strace` and says
  `⚠ ejemplo sin comprobar: strace no existe en macOS`.
- 009-US2-AS4: a card comparing two tools with nothing to run (a VM vs a container) carries no
  example.

## 4. Rewrites in review and prune, in `prod`

In "repasemos", on a Rust card saved before the slice:

- After the release, "dame un ejemplo en código": the before and after adds the block with its check line
  (009-US2-AS1, 009-US2-AS2), and every tag the rewrite adds shows in the before and after,
  taken from `aletheia tag list` (009-US1-AS4).
- No release needed: ask to widen a card toward another card in the deck. Claude runs `aletheia card search`
  first, sets the card itself aside, and the before and after carries `⚠ se solapa con #…` with
  the choice to drop it, save it, or merge both (009-US4-AS1). The same holds for a rewrite in
  place or a replacement in "podemos el mazo".
- No release needed: ask to change only a card's tags. No search runs (009-US4-AS2).

## 5. The profile in review, in `prod`, no release needed

- 009-US3-AS1: say "nunca he creado errores custom". No profile offer.
- 009-US3-AS2: say "ya uso Docker a diario en el trabajo". Expected:
  `¿Cambio en tu perfil «aprendiendo» por «uso diario»?` for the Docker line, not a second line.
- 009-US3-AS3: say "ya entiendo cómo el kernel agenda los procesos". Expected: an offer to
  change the Linux line to a general level («conozco lo básico de los internos»), without naming
  how the kernel schedules.
- After the release, the same three statements at a capture ("guarda esto") get the same
  offers from `az-aletheia-add` (009-US3-AS1, 009-US3-AS2, 009-US3-AS3).

## 6. Measures (two weeks after the release)

- SC-001: every card captured with something to run carries an example; no review asks for one.
- SC-002: no tag is added by hand to a card captured after the release.
- SC-003: every example a draft said was checked compiles or runs when tried again.
- SC-004: no profile line is turned down for being too specific.
- SC-005: no prune finds an overlap made by a rewrite saved after the release.
