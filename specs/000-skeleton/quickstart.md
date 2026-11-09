# Quickstart: Skeleton

How Angelo checks slice 0 end to end. Commands and outputs follow
[contracts/cli.md](./contracts/cli.md); file names follow [data-model.md](./data-model.md).

## Prerequisites

- macOS with Node 26 and pnpm on PATH; `pnpm bin -g` is on PATH.

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
ls data/backups/                     # test-….sqlite copies, next to data/test.sqlite
ALETHEIA_DB=/tmp/x.sqlite pnpm aletheia backup   # env: custom (/tmp/x.sqlite); a custom-… copy in data/backups/
aletheia backup                      # env: prod; a prod-….sqlite copy in ~/.aletheia/backups/
ls ~/.aletheia/backups/
```

Running `backup` six times leaves five copies of that env. Nothing lands under
`~/Library/Mobile Documents`.

## 4. Restore (by hand)

```sh
cp ~/.aletheia/backups/prod-<instant>.sqlite ~/.aletheia/prod.sqlite
```

SC-003 without touching `prod`: copy a development copy over a scratch store and open it.

```sh
cp data/backups/test-<instant>.sqlite /tmp/aletheia-restore.sqlite
ALETHEIA_DB=/tmp/aletheia-restore.sqlite pnpm aletheia backup   # exit 0: the copy opens as a store
```

## 5. Migrations

Slice 0 ships none. `pnpm test -t 000-US4` runs the scenarios over fixture migrations; the
first real one arrives with slice 1 and applies, after a backup, on the first `aletheia` in
`prod` after its release.

## Measures

Taken 2026-11-09 on Angelo's Mac, release `0.0.0 (5efa773)`.

| Criterion | Command | Result | Limit |
|-----------|---------|--------|-------|
| SC-001 | fresh clone, `pnpm install`, `pnpm release` | pending | 5 min |
| SC-002 | `time aletheia --help` | 0.03–0.04 s | 1 s |
| SC-002 | `time aletheia backup` in `prod` | 0.05 s | 1 s |
| SC-003 | a `test-<instant>.sqlite` copy over a scratch store, then `ALETHEIA_DB=<scratch> pnpm aletheia backup` | exit 0, opens as a store | — |
| SC-004 | `time pnpm test` | 1.7 s, 71 tests; `data/`, `~/.aletheia/` and the installed `aletheia` unchanged | 5 s |
| SC-005 | `time pnpm release` | 5.0 s | 1 min |

Nothing from aletheia under `~/Library/Mobile Documents`.
