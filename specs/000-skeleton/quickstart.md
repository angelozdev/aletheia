# Quickstart: Skeleton

How Angelo checks slice 0 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); file names follow [data-model.md](./data-model.md).

## Prerequisites

- macOS with iCloud Drive on (`~/Library/Mobile Documents/com~apple~CloudDocs` exists).
- Node 26 and pnpm on PATH; `pnpm bin -g` is on PATH.

## 1. Development checks

```sh
cd ~/me/aletheia
pnpm install
pnpm check                 # test, lint, format:check, typecheck, dead-code, duplication
pnpm aletheia --help       # usage, exit 0, no env: line
pnpm aletheia --version    # dev
```

## 2. Release

On `main`, after merging, with a clean tree:

```sh
pnpm release               # release: 0.0.0 (<commit>) installed
cd /tmp && aletheia --help # same usage, from outside the repo
aletheia --version         # 0.0.0 (<commit>)
```

Refusals: on another branch, with uncommitted changes, or with a red check, `pnpm release`
prints `release: refused: …` and `aletheia --version` still shows the previous commit.

## 3. Environments and backup

```sh
pnpm aletheia backup                 # stderr: env: test; stdout: path and removed copies
pnpm aletheia backup --json
ALETHEIA_DB=/tmp/x.sqlite pnpm aletheia backup   # env: custom (/tmp/x.sqlite)
aletheia backup                      # env: prod; a prod-….sqlite copy in iCloud Drive
ls ~/Library/Mobile\ Documents/com~apple~CloudDocs/aletheia-backups/
```

Running `backup` six times leaves five copies of that env.

## 4. Restore (by hand)

```sh
cp ~/Library/Mobile\ Documents/com~apple~CloudDocs/aletheia-backups/prod-<instant>.sqlite \
   ~/me/aletheia/data/prod.sqlite
```

## 5. Migrations

Slice 0 ships none. `pnpm test -t 000-US4` runs the scenarios over fixture migrations; the
first real one arrives with slice 1 and applies, after a backup, on the first `aletheia` in
`prod` after its release.
