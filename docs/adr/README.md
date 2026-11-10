# Architecture Decision Records

Technical and architecture decisions for Aletheia. Each decision is one file named
`NNNN-slug.md`. Numbering is stable: never renumber; gaps from rejected ADRs are kept.
Status goes `proposed → accepted`; a decision is superseded, never edited.

Product decisions live in `docs/design/` and the Spec Kit specs.

## Index

| #    | Title | Status | Date |
|------|-------|--------|------|
| 0001 | Data inside the repo, environment by invocation | superseded by 0008 | 2026-11-08 |
| 0002 | Drizzle ORM over node:sqlite, migrations applied at startup | accepted | 2026-11-08 |
| 0003 | Commander CLI, TOON by default, JSON on request | accepted | 2026-11-08 |
| 0004 | Functional core and imperative shell in concept folders | accepted | 2026-11-08 |
| 0005 | Release as a Rolldown bundle installed globally | accepted | 2026-11-08 |
| 0006 | oxlint with local rules, oxfmt, knip and jscpd | accepted | 2026-11-08 |
| 0007 | One folder per module, with types, errors and constants files | accepted | 2026-11-09 |
| 0008 | Installed data in a home dotfolder, development data in the repo | accepted | 2026-11-09 |
| 0009 | Backups in the data folder, not iCloud Drive | accepted | 2026-11-09 |
| 0010 | The store is opaque outside the db adapter | accepted | 2026-11-09 |
| 0011 | The release copies the global skill | accepted | 2026-11-09 |
| 0012 | ts-fsrs 5 with FSRS-6 and one learning step, behind one core module | accepted | 2026-11-09 |
| 0013 | Cards, tags and reviews, with their rules in the store | accepted | 2026-11-09 |
| 0014 | Card search with FTS5, terms built in the core | accepted | 2026-11-09 |
| 0015 | The profile is an untracked file, read and edited in place | accepted | 2026-11-09 |
