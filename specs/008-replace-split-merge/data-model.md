# Data Model: Replace, Split and Merge

No change to the store: no table, column, `CHECK`, trigger or migration (research R1). A
replacement writes what 001 and 007 already write.

| Step | Command | What the store gains |
|---|---|---|
| Save the new cards | `aletheia card add` (001) | one `cards` row per draft, `state: new`, fresh schedule, its `card_tags` |
| Retire each old card | `aletheia card archive` (007) | `cards.status = archived` and a `card_status_history` row with the reason |

## Text conventions (research R3)

| Where | Text | Example |
|---|---|---|
| Old card's archive reason | `reemplazada por #<id>[, #<id>…]: <why>` | `reemplazada por #b4n8, #c5p9: tenía dos ideas en una` |
| New card's source, in prune or review | `reemplaza a #<id>[, #<id>…]` | `reemplaza a #9p3x, #w2ab` |
| New card's source, at capture | `<usual source>; reemplaza a #<id>` | `conversación en ~/work/orders, acks de RabbitMQ; reemplaza a #9p3x` |

Only Claude reads them. The rules that hold are 001's (a draft) and 007's (an archive with a
reason not blank, INV-03); nothing is deleted (INV-02).
