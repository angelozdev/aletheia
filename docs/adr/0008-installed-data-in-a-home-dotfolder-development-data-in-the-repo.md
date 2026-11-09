# 0008. Installed data in a home dotfolder, development data in the repo

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** 0001
- **Superseded by:** —

## Context and problem statement

ADR-0001 put every store in the repo's `data/`, and the release found it through the repo path
recorded at build time. Angelo prefers the user's data outside the repository, the way tools
such as zsh keep theirs in the home folder (`~/.zshrc`): the repo holds the code, the home
folder holds what the code works on. Keeping `prod.sqlite` in the repo also has two costs:
`git clean -x` or `-X` deletes the gitignored `data/` and the real deck with it, and the
installed release depends on the repo path at runtime. Where does each entry point find its
store, and which env does each default to?

## Decision drivers

- The installed `aletheia` and the global skill reach the `prod` store from any working
  directory (spec 000-US1-AS3).
- The real deck lives outside the repository, out of reach of git commands run in it.
- Running the sources never lands on `prod` by accident (constitution: `prod` is reached only
  by the installed binary or an explicit `--env prod`).
- Tests and evals never reach a real store (INV-01).

## Considered options

1. `~/Library/Application Support/aletheia/` for every env
2. `~/.local/share/aletheia/` (XDG) for every env
3. `~/.aletheia/` for the installed `aletheia`; the sources keep the repo's `data/`
4. `~/.aletheia/` for every env

## Decision outcome

Chosen option: **3** (Angelo, 2026-11-09). The release entry defaults to `prod` and keeps its
stores in `<home>/.aletheia/<env>.sqlite`; the folder is created on first use. The source entry
defaults to `test` and keeps `data/` three levels above itself, ignored by git. `--env x` maps
to `<data folder>/x.sqlite`; `ALETHEIA_DB` takes an absolute path and shows as
`custom (<path>)`; env names are lowercase letters, digits and dashes, `custom` reserved. The
resolution order stays `--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > invocation default. Under
vitest neither entry has a data folder, so named envs are refused (INV-01). Every command
prints `env: <name>` on stderr.

### Pros and cons of the options

**Application Support for every env**
- Good, because it is where macOS apps keep their own data.
- Bad, because the path has a space and is long to type when restoring by hand.

**XDG `~/.local/share` for every env**
- Good, because many CLI tools follow it and it carries over to Linux.
- Bad, because on macOS it is a convention few look in.

**`~/.aletheia/` installed, `data/` from the sources**
- Good, because the real deck sits at a short, visible path, like `~/.zshrc`.
- Good, because the release no longer needs the repo at runtime.
- Good, because development stores stay next to the code that uses them.
- Bad, because there are two rules, one per entry point, and `git clean -x` can still delete
  the development stores (test data, which can be rebuilt).

**`~/.aletheia/` for every env**
- Good, because there is one rule for both entry points.
- Bad, because test data from development shares a folder with the real deck.

## Consequences

- Good: moving or recloning the repo touches neither the real deck nor the installed release.
- Good: no git command run in the repo can delete `prod.sqlite`.
- Good: ADR-0005's driver "nothing from the repo at runtime except `data/`" now holds without
  the exception; `__ALETHEIA_RELEASE__.repoRoot` is used by the build only.
- Bad / cost: the two entry points keep their stores in different places, so a restore
  command depends on the env (quickstart §4).

## Confirmation

Context tests cover each entry's default env and data folder (000-US1-AS3), and `main()` tests
cover the resolution order and refusals (000-US1-AS4) with an injected home and data folder;
under vitest both entries refuse named envs (INV-01).
