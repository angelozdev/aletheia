# CLI Contract: Skeleton

Two entry points run the same `main()`: the released `aletheia` (default env `prod`, stores in
`~/.aletheia/`) and `pnpm aletheia` (sources, `ALETHEIA_ENV=test`, stores in the repo's
`data/`). Exit 0 on success, 1 on any error.

## Streams

- **stdout**: the command's result only. TOON by default, one-line JSON with `--json`.
  Help and version also go to stdout.
- **stderr**, in this order when present:
  - `env: <name>` (or `env: custom (<path>)`), first line of every command that opens a store
  - `backup: <path> (before migrating)`, in `prod` when migrations are pending
  - `migrated: <folder name>`, one per migration applied
  - `error: <message>`, on failure, with nothing on stdout

## Global options

| Option         | Meaning |
|----------------|---------|
| `--env <name>` | use `<name>.sqlite` in the data folder |
| `--json`       | JSON instead of TOON on stdout |
| `-h, --help`   | usage on stdout, exit 0; opens no store, no `env:` line |
| `-V, --version`| `<version> (<commit>)` released, `dev` from sources; opens no store |

Environment variables: `ALETHEIA_DB=<absolute path>`, `ALETHEIA_ENV=<name>`.

## `aletheia backup`

Copies the current env's store into `backups/` in the entry's data folder (data-model.md, Backup
copy).

TOON:

```
path: /Users/angelozdev/.aletheia/backups/prod-2026-11-08T21-04-05-123Z.sqlite
removed[1]: /Users/angelozdev/.aletheia/backups/prod-2026-11-01T10-00-00-000Z.sqlite
```

With no copy removed, the second line is `removed: []`.

JSON: `{"path":"…","removed":["…"]}`

Errors: `error: cannot write backup to <folder>: <reason>`; `error: backups are disabled here
(under vitest)`.

## Errors shared by every command

- unknown command or option: commander's message after `error:`, no store opened
- `error: invalid --env "<value>": use lowercase letters, digits and dashes`
- `error: invalid ALETHEIA_ENV "<value>": use lowercase letters, digits and dashes`
- `error: invalid --env "custom": custom is reserved for ALETHEIA_DB` (likewise `ALETHEIA_ENV`)
- `error: invalid ALETHEIA_DB "<value>": must be an absolute path`
- `error: named environments are disabled here (<source>: <name>); set ALETHEIA_DB to a temporary file` (under vitest)
- `error: the store has migrations this code does not know: <names>`
- `error: migration <name> failed: <reason>`

## `pnpm release`

Not part of `aletheia`; a repo script Angelo runs from `~/me/aletheia`.

1. Refuses unless on `main` with a clean tree: `release: refused: on <branch>, not main` or
   `release: refused: uncommitted changes`.
2. Runs `pnpm check` (the six checks); a failure: `release: refused: <check> failed`.
3. Builds `dist/aletheia.js` with the release constants, packs into `.release/`, smoke-runs
   the packed `--help` and `--version` from a temp folder, installs the tarball globally, and
   checks `aletheia --version` from PATH. A failed smoke run refuses before installing:
   `release: refused: smoke run failed: <reason>` (`--help exited <status>` or
   `--version printed "<x>", expected "<y>"`). A mismatch after installing:
   `release: failed: aletheia on PATH prints "<x>", expected "<y>"`.
4. Prints `release: <version> (<commit>) installed`. Never opens a store.
