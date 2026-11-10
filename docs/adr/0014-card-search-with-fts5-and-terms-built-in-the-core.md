# 0014. Card search with FTS5, terms built in the core

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0010](0010-the-store-is-opaque-outside-the-db-adapter.md),
  [0013](0013-cards-tags-and-reviews-with-rules-in-the-store.md)

## Context and problem statement

Before showing a draft, `az-aletheia-add` asks the CLI for the cards similar to it, and Claude
judges whether one is a duplicate (spec 002). Design §9 chose SQLite FTS5 plus tags, with no
vectors. Spanish words change form (`consumidor`, `consumidores`), the search text carries
backticks, quotes and code, and every Spanish question shares `qué` or `de` with every other.
How are cards indexed and queried so the right ones come back, safely, from a store that already
holds cards?

## Decision drivers

- Singular and plural, case and accents match (002-US1-AS2); common words never count (AS1).
- No character of the search text changes the query (FR-003).
- Cards saved before the slice are found, and new ones at once, with no rebuild step (FR-002).
- The tag hierarchy and the order are core logic with unit tests (constitution II).
- Under 1 second on 1,000 cards (SC-004); no network, no new dependency.

## Considered options

1. An FTS5 table filled by a trigger, terms built in the core, tags and order in the core
2. An external-content FTS5 table, or the `trigram` tokenizer
3. No index: score every active card in the core

## Decision outcome

Chosen option: **1**. A custom migration creates `card_search(card_id UNINDEXED, question,
answer, key_points, situation)` with `unicode61 remove_diacritics 2`, an `AFTER INSERT ON cards`
trigger that fills it, and an insert that backfills the cards already stored. `src/core/similar`
turns the words into terms: accents and case folded, split on anything but `a`–`z` and digits,
one-character and common words dropped (a list in the core, about a hundred words), plurals made
singular. The adapter quotes each term as a prefix (`"consumidor"*`), joins them with `OR` and
returns the active matches by bm25 through `CardRepository.matching(terms)`. The core adds the
active cards sharing a tag family, orders the three groups and keeps 10.

### Pros and cons of the options

**FTS5 table, core terms**
- Good, because SQLite ships bm25 and prefix matching, and a term of `a`–`z` and digits cannot
  reach FTS5's query syntax.
- Good, because the trigger indexes a card in the transaction that saves it.
- Bad, because the table copies the card text, and slice 4 must add an update trigger when
  cards can be rewritten.

**External content or trigram**
- Bad, because external content needs an exact sync and a `'rebuild'`, and fails silently when
  it drifts; trigram still misses `consumidores` → `consumidor`, never matches terms under three
  letters (`ps`) and triples the index.

**No index**
- Good, because it needs no schema.
- Bad, because it hand-rolls relevance that SQLite provides, against design §9.

## Consequences

- Good: the store finds similar cards on its own, and the rules that pick terms and order them
  are unit tested in the core.
- Bad / cost: a virtual table outside the Drizzle schema, known only to the migration and one
  repository query; prefix noise (`bas*` matches `bash`), which Claude reads past.
- If paraphrased duplicates slip through twice, `sqlite-vec` (design §14) is the next step.

## Confirmation

CLI tests of 002-US1-AS1 to AS6 over temp stores, AS6 over a store migrated before and after the
search migration; unit tests of the terms, the tag family and the order in `src/core/similar`.
