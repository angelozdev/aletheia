---
name: az-aletheia-add
description: Use when Angelo wants to keep something from the current conversation as spaced-repetition cards in Aletheia, from any repo. Triggers on "guarda esto", "haz una tarjeta", "añade esto a aletheia", "guárdalo en aletheia", "hazme tarjetas de esto". Drafts cards, shows every draft for approval, and saves only the approved ones through the installed aletheia CLI.
---

# az-aletheia-add

Turn what Angelo just learned into cards for his daily review. You draft, he decides, the
`aletheia` CLI stores. Talk to Angelo in Spanish. Card content is Spanish with technical terms
in English; tags are English.

## Rules

- Nothing is saved without Angelo's approval of that exact card.
- The `aletheia` CLI is the only writer. Never open, read or edit a store file, never write SQL,
  never choose an environment: plain `aletheia` writes to Angelo's real deck.
- Every question about existing cards, while drafting or after, is answered by running
  `aletheia card search` or `aletheia card show`, never from memory or from earlier in the
  session.

## 0. Read the profile

Before drafting, read `~/me/aletheia/PROFILE.md`: Angelo's level by area and what counts as
already known. It is context for judging whether a card is useful, not a whitelist of topics.
If it cannot be read, say so in one line and draft without it, flagging nothing as already
known.

## 1. Draft

List the tags in use first, in that turn:

```sh
aletheia tag list
```

It prints each tag with its ancestors and how many active cards it covers.

Draft from the conversation, one card per idea worth remembering. Fewer, better cards beat many.
Every draft is held to these rules:

1. **One idea or mechanism.** An unrelated "and also" is a second card.
2. **An answer of one to three lines.** Longer means it is not one idea yet. An example goes
   after them, in its own code block, and does not count toward them, whatever its length.
3. **A question that stands alone.** It names the technology, and the variant when it matters
   ("una cola _classic_ de RabbitMQ"). No "esto", "lo de antes", "nuestro proyecto".
4. **A credible situation** where knowing it matters.
5. **Not trivia.** No dates, versions, who created what, or things used once a year and found
   in seconds.
6. **Not already known**, judged against the profile and the similar cards.
7. **No duplicate**, judged by the search (step 2).
8. **An example when the card has something to run**: code, a command or a short program that
   shows its idea, in a language card or a system one (`strace` for a system call). A
   comparison, or a concept nothing runnable shows, gets none. A `command` card's answer is its
   example, run read-only to check it, and a `code` card's snippet, in its question, is its
   example: neither gets a second block.

Rules 1–3 and 8 are about shape: fix a draft that breaks one before showing it, by splitting,
shortening, rephrasing or adding its example. Rules 4–7 are about worth: never drop a draft for breaking one; flag
it with its reason, in Spanish, and let Angelo decide:

- `⚠ sin situación creíble: <por qué>`
- `⚠ trivia: <por qué>`
- `⚠ ya lo sabes por tu perfil: <qué línea>`
- `⚠ duplica a #<id>` or `⚠ se solapa con #<id>: …` (step 2)

Pick the granularity between too broad and too atomic:

- Too broad: "¿Qué es un consumer group en Redis Streams?"
- Too atomic: "En un consumer group, ¿cuántos consumidores reciben cada mensaje?" → "Uno."
- Balanced: "En Redis Streams, ¿cómo reparte un consumer group los mensajes entre sus
  consumidores, y qué tiene que hacer un consumidor para que Redis dé un mensaje por
  procesado?" → "Cada mensaje va a un solo consumidor. El consumidor confirma con `XACK`;
  hasta entonces el mensaje queda en la lista de pendientes (PEL)."

### The five types

| type | Shape | Example question |
|---|---|---|
| `concept` | how something works or what it guarantees | "En PostgreSQL, ¿qué garantiza `SERIALIZABLE` que `REPEATABLE READ` no?" |
| `comparison` | X vs Y on one specific dimension | "En Kafka y RabbitMQ classic, ¿qué pasa con un mensaje después de que el consumidor lo confirma?" |
| `command` | which command or flag does a specific thing | "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?" |
| `scenario` | given a concrete situation, what do you do | "Un pod de Kubernetes queda en `CrashLoopBackOff` sin logs útiles. ¿Qué miras primero y con qué comando?" |
| `code` | read a short snippet: its output, its complexity or its bug | "En JavaScript, ¿qué imprime `[1, 10, 2].sort()` y por qué?" |

A `code` question carries its snippet in a fenced block inside the question.

### The fields

- `type`: one of the five above.
- `question`, `answer`: as above; the answer is what Angelo will be shown after he answers.
- `keyPoints`: one to three short points the answer must contain; review grades against them.
- `situation`: one sentence, the moment where this matters ("Un contenedor se cayó y no aparece
  en `docker ps`.").
- `tags`: one or more, in English, lowercase `a`–`z`, digits and dashes, in segments joined by
  `::`, from general to specific: `docker::commands`, `messaging::redis-streams`. No accents,
  no `ñ`, no uppercase. One tag for each topic the card rests on: its subject, the concept it
  builds on (`rust::ownership` for a card on `String` vs `&str`), and the library it is about,
  under its language with its ecosystem's word for a library (`rust::crates::anyhow`,
  `typescript::packages::zod`, `python::packages::requests`). Reuse a tag in use before making
  one. A topic the card only mentions gets none. Angelo may name a topic in Spanish; you find
  its English tag.
- `source`: the name of the repo you are in, or the study context when there is no repo
  ("libro Designing Data-Intensive Applications").

### The example

The example goes at the end of `answer`: its lines, a blank line, then a fenced block naming
its language (`rust`). The block is the code that ran, whole: a complete program, with its
`use` lines and `fn main`, so it runs again as stored.

Check it before showing the draft, in a folder from `mktemp -d`, never in the repo, `data/` or
`~/.aletheia/`. Use `rustc` for a Rust snippet on `std`, and `cargo` in a throwaway project for
one on a crate. Use `node` for JavaScript and TypeScript: Node strips types and does not check
them, so a card on a type error needs `tsc` at hand, or says it was not checked. Use `python3`
for Python, and the command itself for a read-only one (`docker ps -a` with Docker running).

```sh
dir=$(mktemp -d)
cat > "$dir/main.rs" <<'RS'
struct Celsius(f64);

impl From<f64> for Celsius {
    fn from(grados: f64) -> Self {
        Celsius(grados)
    }
}

fn main() {
    let c: Celsius = 21.5.into();
    println!("{}", c.0);
}
RS
rustc --edition 2024 "$dir/main.rs" -o "$dir/main" && "$dir/main"; echo "exit=$?"
```

- The verdict is the exit status the same call prints, never the text the run prints. An
  example meant to fail (`"42".parse()` with no type) passes when it fails with the error the
  card names (E0284). A `code` card's snippet, in its question, is checked the same way.
- Fetching a crate or package into the throwaway project through its package manager is the
  toolchain at work. Never run an example that deletes, writes outside the folder, calls a
  server or needs root.
- A Linux-only tool missing on the Mac (`strace`) leaves the example unchecked: start no
  container for it.
- A failing example is fixed and run again. One that cannot be fixed is shown failing, never
  as checked.

## 2. Search for similar cards

Before showing any draft, search the deck once for each draft. Drafts are independent: run
their searches in parallel.

```sh
aletheia card search <<'JSON'
{
  "words": "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`? `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos. detenidos stopped exited --all",
  "tags": ["docker::commands"]
}
JSON
```

- `words`: the draft's question and answer, plus synonyms and the draft's technical terms in
  Spanish and English (`detenidos stopped exited --all` for `docker ps -a`), so a card worded
  differently still comes back. The JSON rules of `card add` apply.
- `tags`: the draft's tags.

stdout lists up to 10 cards, `cards[n]` with `id`, `type`, `tags`, `question`, `answer`,
`status` and `archiveReason`, or `cards: []` when nothing is similar. They are candidates,
never verdicts: read every listed card and judge it against the draft.

- The draft says what a card already says: flag it `⚠ duplica a #<id>`.
- The draft repeats part of a card and adds something:
  `⚠ se solapa con #<id>: <qué repite>; agrega <qué es nuevo>`.
- The card it repeats is listed with `status: archived`: Angelo retired it. Add `archivada` and
  his reason, the card's `archiveReason`, to the flag, and quote the archived card's question:
  `⚠ duplica a #<id>, archivada: «<archiveReason>»`.
- The archived card's `archiveReason` starts with `reemplazada por #`: other cards took its
  place. Run `aletheia card show <id>` for each id it names, and judge the draft against an
  active one as against any active card (`duplica a`, `se solapa con`, merge). Offer
  no restore for the replaced card: it would leave two cards saying the same. When none of them
  is active, follow their own `archiveReason` the same way; when the chain ends in no active
  card, flag the draft as repeating an archived card, above.
- Sharing a word or a tag alone is not a repeat: no flag.

Two drafts of the same batch that repeat each other are merged, or one is dropped, before
showing them. If a search exits 1, read its `error:` line, fix the JSON and search again;
never show a draft whose search did not answer.

## 3. Show every draft

Before saving anything, show each draft numbered, with every field. A draft with an example
carries its check line under its header, before any flag, and a flagged draft its flag:

```
1. command · docker::commands
   ✓ ejemplo comprobado: docker ps -a, exit 0
   ⚠ duplica a #k7m2
   Pregunta: En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?
   Respuesta: `ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.
   Key points: `ps`: solo en ejecución · `-a`: incluye detenidos
   Situación: Un contenedor se cayó y no aparece en `docker ps`.
```

The check line is one of three:

- `✓ ejemplo comprobado: <herramienta>, exit <n>`, naming the crate or package it fetched
  (`✓ ejemplo comprobado: cargo con anyhow, exit 0`);
- `⚠ ejemplo sin comprobar: <por qué>` (`⚠ ejemplo sin comprobar: strace no existe en macOS`);
- `⚠ ejemplo falla: <el error>`, for one that cannot be fixed.

The line is not stored.

A tag the list did not print is marked `(nuevo)` in the header, so a typo or a near-duplicate
shows before it is saved; send it without the mark:

```
2. concept · rust::error-handling, rust::crates::anyhow (nuevo)
```

Show flagged drafts with the rest, never drop one silently. Ask Angelo to approve, edit or
reject each one; a flagged draft is decided like any other, and its flag is not stored. Apply
his edits exactly. A rejected draft is dropped and never stored. If he approves none, save
nothing.

A draft that repeats an archived card offers three choices: drop the draft, save it anyway as
a new card, or restore the archived card instead of saving the draft. Restore it only when he
chooses so, the id without `#`, and drop the draft:

```sh
aletheia card restore k7m2
```

It comes back with the schedule it had.

A draft that overlaps an active card (`⚠ se solapa con #<id>`) offers three choices: drop the
draft, save it as its own card, or merge both into one card. A merge is one draft that holds
both, by the rules of step 1, shown with the old card's question. Ask his why in his words if
he has not said it: it goes in the old card's archive reason. Save the merged draft and archive
the old card only after Angelo approves the merged draft and gives his why. It goes in the same
`aletheia card add` as the rest, its `source` the usual one followed by `; reemplaza a #<id>`
(`"source": "orders; reemplaza a #9p3x"`).

## 4. Save the approved cards

Send every approved card in one call, a JSON list on stdin through a quoted heredoc, so
backticks, accents and multi-line code arrive untouched:

```sh
aletheia card add <<'JSON'
[
  {
    "type": "command",
    "question": "En Docker, ¿qué diferencia hay entre `docker ps` y `docker ps -a`?",
    "answer": "`ps` muestra solo los contenedores en ejecución; `-a` incluye los detenidos.",
    "keyPoints": ["`ps`: solo en ejecución", "`-a`: incluye detenidos"],
    "situation": "Un contenedor se cayó y no aparece en `docker ps`.",
    "tags": ["docker::commands"],
    "source": "diarium"
  },
  {
    "type": "concept",
    "question": "En Rust, ¿qué te da implementar `From<A> for B`?",
    "answer": "Convierte un `A` en un `B` con `B::from(a)`, y gratis `a.into()` donde se espera un `B`.\n\n```rust\nstruct Celsius(f64);\n\nimpl From<f64> for Celsius {\n    fn from(grados: f64) -> Self {\n        Celsius(grados)\n    }\n}\n\nfn main() {\n    let c: Celsius = 21.5.into();\n    println!(\"{}\", c.0);\n}\n```",
    "keyPoints": ["`B::from(a)` convierte `A` en `B`", "`.into()` viene gratis"],
    "situation": "Una función recibe `Celsius` y quieres pasarle un `f64` sin envolverlo a mano.",
    "tags": ["rust::traits"],
    "source": "aletheia"
  }
]
JSON
```

The JSON must be valid: escape `"` and `\` inside strings and write line breaks as `\n`. Send
only these seven fields.

stdout gives the ids in the order sent, `ids[2]: k7m2,p3x9` (an id of digits only comes
quoted: `"0123"`). Tell Angelo each saved card by its id written `#k7m2`.

Then, for each merged draft, archive the old card it replaces, the id without `#`, the reason
`reemplazada por #<new>: <his why>`:

```sh
aletheia card archive <<'JSON'
{"card":"9p3x","reason":"reemplazada por #a7k2: se solapaban, mejor una con ambos ejemplos"}
JSON
```

If it exits 1, the cards are already saved: say which old card is still active beside the new
one, fix the JSON and archive it again; never send the drafts a second time.

The list is saved whole or not at all. If the command exits 1, nothing was stored: read the
`error:` line on stderr, for example
`error: card 2: situation: is required; tags[0]: use a-z, digits and dashes, in segments joined by ::`
(cards are numbered from 1 in the list you sent), fix those drafts, show the fixed ones to
Angelo again, and send the approved list again.

## 5. Questions about a card

When Angelo asks about a saved card ("muéstrame esa tarjeta", "¿cuándo toca?"), run
`aletheia card show k7m2`, the id without `#` (a shell reads `#` as a comment), and answer from
what it prints. Its instants are already in Angelo's local time; read them as printed.

## Keep the profile current

Only while this skill runs, listen for Angelo stating his own level: "uso Terraform a diario",
"nunca he tocado Kubernetes", a draft rejected with "eso ya lo sé".
Only explicit statements count: never a grade, a streak of Easy, or your guess.

Offer a line only for an area's level, his role, or how he learns. A narrow fact inside an area
gets no offer: one crate, one flag, one thing he has or has not done in it («nunca he creado
errores custom» under Rust). The exception is a narrow fact that changes the area's level: then
offer the area's new line in general words, never naming the fact ("ya domino Lambda" against
"estudiando AWS" → `¿Cambio en tu perfil «estudiando AWS» por «uso AWS en proyectos»?`).

When he states one, end your next reply with one line offering the change, without holding
back the drafts:

- `¿Anoto en tu perfil: «<línea>»?` when no line covers that area;
- `¿Cambio en tu perfil «<antes>» por «<después>»?` when a line already covers it, or says
  something else ("ya uso Docker a diario" against "Docker: aprendiendo"): change that line,
  never add a second one.

The profile is `~/me/aletheia/PROFILE.md`, one bullet per area in Spanish
(`- **Terraform**: uso diario.`). Edit it only after Angelo approves that exact line, and touch
nothing else in it. If he ignores the offer or says no, drop it and do not offer it again.
