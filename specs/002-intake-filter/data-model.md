# Data Model: Intake Filter

Additions to [slice 1's data model](../001-capture-and-review/data-model.md), which stands.
Reasons are in [research.md](./research.md).

## `card_search` (FTS5 virtual table, custom migration)

| Column | Indexed | Holds |
|---|---|---|
| `card_id` | no (`UNINDEXED`) | the card's id, to join back to `cards` |
| `question` | yes | `cards.question` |
| `answer` | yes | `cards.answer` |
| `key_points` | yes | `cards.key_points`, the JSON text; the tokenizer skips its brackets and quotes |
| `situation` | yes | `cards.situation` |

- Tokenizer `unicode61 remove_diacritics 2`: case and accents folded in the index and in the
  query.
- Trigger `card_search_on_insert`, `AFTER INSERT ON cards`: one row per card, in the transaction
  that saves it.
- The migration fills the table from the cards already stored, so a store from slice 1 is
  searchable once migrated (002-US1-AS6). `aletheia` backs up `prod` before migrating (slice 0).
- No update or delete trigger: cards are never deleted (INV-02) and no command changes a card's
  text before slice 4, which adds the update trigger.
- Not in the Drizzle schema: only the migration SQL and the repository's `matching` query know
  it (ADR-0010).

## Search terms (core, not stored)

A search's words become terms: accents and case folded; split on anything but `a`–`z` and
digits; one-character words and common words dropped; plurals made singular (`-es` from five
letters, `-s` from four); repeats dropped. Each term matches as a prefix. Tags follow the
grammar of slice 1; a tag's family is the tag, its ancestors and its descendants
(`messaging::redis-streams` ↔ `messaging`, `messaging::redis-streams::pel`; not its sibling
`messaging::rabbitmq`).

## Similar cards (core, not stored)

1. Word matches sharing a tag family with the search, by relevance.
2. Word matches not sharing one, by relevance.
3. Active cards sharing only a tag family, newest first.

At most `SIMILAR_CARDS_LIMIT` (10). Only active cards; every card is active in this slice.

## `PROFILE.md` (repo root, ignored by git, not in the store)

Spanish Markdown, one bullet per area, edited in place by the skills after Angelo approves the
exact line:

```markdown
# Perfil de Angelo

- **Frontend**: muy fuerte; lo básico (hooks, CSS, el DOM) cuenta como ya sabido.
- **Backend**: conocimiento de trabajo.
- **AWS**: lo está estudiando (AWS Commit Academy).
```

The text above is an example; the first version is approved by Angelo during implementation.

## Flags (skill output, not stored)

`duplica a #<id>`, `se solapa con #<id>`, `trivia`, `ya lo sabes por tu perfil`,
`sin situación creíble`.
