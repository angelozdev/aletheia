# Data Model: Tags and Code Examples

No change to the store: no table, column, `CHECK`, trigger or migration (research R1). A card
written by this slice is a card of 001 with 002's tag format; its example is part of `answer`.

## Text conventions

| Where | Text | Stored | Example |
|---|---|---|---|
| A library's tag (R3) | `<language>::<ecosystem word>::<name>` | yes, as a tag | `rust::crates::anyhow`, `typescript::packages::zod`, `python::packages::requests` |
| A tag not in `aletheia tag list`, in the draft's header (R3) | `<tag> (nuevo)` | no | `1. concept · rust::error-handling, rust::crates::anyhow (nuevo)` |
| The example (R1) | the answer's lines, a blank line, a fenced block naming its language | yes, in `answer` | #62tw's answer: its lines, then a `rust` block desugaring `?` into a `match` with `From::from(e)` |
| The check, under the draft's header (R4) | `✓ ejemplo comprobado: <herramienta>, exit <n>` or `⚠ ejemplo sin comprobar: <por qué>` | no | `⚠ ejemplo sin comprobar: strace no existe en macOS` |
| A rewrite's flag, on the before and after (R7) | add's flags: `⚠ duplica a #<id>`, `⚠ se solapa con #<id>: <qué repite>; agrega <qué es nuevo>` | no | `⚠ se solapa con #805p: los adaptadores son lazy; agrega .filter y .take_while` |
| A profile line (R6) | one bullet per area, general words | in `PROFILE.md`, after approval | `- **Docker**: uso diario.` |

Only Claude writes and reads the markers and lines; the rules that hold are 001's (a draft),
002's (a tag) and ADR-0015's (the profile, edited only after Angelo approves the line).
