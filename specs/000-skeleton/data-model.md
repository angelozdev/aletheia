# Data Model: Skeleton

Slice 0 stores no domain data. These are the shapes the skeleton reads and writes.

## Environment

| Field  | Rule |
|--------|------|
| name   | `^[a-z][a-z0-9-]*$`, or `custom` when it comes from `ALETHEIA_DB` (reserved otherwise) |
| dbPath | `<dataDir>/<name>.sqlite`, or the absolute path in `ALETHEIA_DB` |

Resolution: `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > invocation default (sources `test`,
release `prod`). `dataDir` is `~/.aletheia/` for the release and the repo's `data/` for the sources (ADR-0008), or none under vitest, which makes
every named env a refusal (INV-01). Shown on stderr as `env: <name>`, or `env: custom (<path>)`.

## Store

One SQLite file per environment, created on first open. Its only table in slice 0 is Drizzle's
bookkeeping, created by the migrator:

| `__drizzle_migrations` | |
|---|---|
| id | integer primary key |
| hash | sha256 of `migration.sql` |
| created_at | the folder's timestamp, in milliseconds |
| name | the folder name, `<YYYYMMDDHHMMSS>_<name>` |
| applied_at | ISO instant |

States, by comparing the names in the table with the folders shipped in `migrations/`:

- **current**: every shipped name applied, nothing unknown → no backup, nothing reported.
- **pending**: some shipped names missing → `prod` backs up, then all pending apply in one
  transaction; on failure none is kept.
- **ahead**: a name in the table the code does not ship → refused, nothing applied
  (000-US4-AS5). Checked before pending.

## Migration folder

`migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql`, statements split by
`--> statement-breakpoint` (drizzle-kit 1.0 layout). Slice 0 ships none: `migrations/` holds a
`.gitkeep`. Tests build fixture folders in a temp dir.

## Backup copy

- Folder: `<data folder>/backups/`, i.e. `~/.aletheia/backups/` installed and the repo's
  `data/backups/` from the sources; a store from `ALETHEIA_DB` is copied into the entry's data
  folder as `custom-…`. Created with its parents on first use (000-US3-AS1). With no data folder
  (under vitest) backups are refused (INV-01).
- Name: `<env>-<instant>.sqlite`, the instant as UTC ISO with `:` and `.` turned into `-`,
  e.g. `prod-2026-11-08T21-04-05-123Z.sqlite`. Names sort by time.
- Written as `<name>.partial` through SQLite's online backup, then renamed.
- Retention: after writing, that env's copies beyond the newest 5 are removed. Only names
  matching `^<env>-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.sqlite$` count; nothing else in
  the folder is touched (000-US3-AS2).

## Release

`__ALETHEIA_RELEASE__`, a constant injected by the build into the release entry only
(ADR-0005):

| Field    | Example |
|----------|---------|
| version  | `0.0.0`, from `package.json` |
| commit   | `2033257`, short SHA of `HEAD` on `main` |
| repoRoot | `/Users/angelozdev/me/aletheia` |

`aletheia --version` prints `<version> (<commit>)`; the sources print `dev` (000-US2-AS3).
