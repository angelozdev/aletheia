# 0001. Data inside the repo, environment by invocation

- **Status:** superseded
- **Date:** 2026-11-08
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** 0008

## Context and problem statement

The design (§11) puts the database in `data/` inside the repo at a fixed path, so the global
skill works from any directory, and the constitution fixes the resolution order
`--env` > `ALETHEIA_DB` > `ALETHEIA_ENV` > default by invocation. Spec 000 adds a release: the
installed `aletheia` is a packed build living outside the repo, and development runs the
sources. Where does each one find its store, and which env does each default to?

## Decision drivers

- The released CLI and the global skill must reach `~/me/aletheia/data/prod.sqlite` from any
  working directory (spec 000-US1-AS3).
- Running the sources must never land on `prod` by accident (constitution: `prod` is reached
  only by the installed binary or an explicit `--env prod`).
- Tests and evals never reach `data/` (INV-01).

## Considered options

1. Both entry points resolve `data/` from their own file location
2. The sources resolve `data/` from their location; the release carries the repo's absolute
   path, injected at build time
3. A config file in the home directory names the data folder

## Decision outcome

Chosen option: **2**. `src/shell/cli/bin.ts` (sources) defaults to `test` and finds `data/`
three levels above itself. The release entry defaults to `prod` and takes the repo path from
`__ALETHEIA_RELEASE__`, injected by the build (ADR-0005). `--env x` maps to `data/x.sqlite`;
`ALETHEIA_DB` takes an absolute path and shows as `custom (<path>)`; env names are lowercase
letters, digits and dashes, `custom` reserved. Under vitest the bin passes no data folder, so
named envs are refused (INV-01). Every command prints `env: <name>` on stderr.

### Pros and cons of the options

**Own location for both**
- Bad, because the release lives in the global package folder, far from `data/`.

**Sources by location, release by recorded path**
- Good, because neither depends on the working directory, and the sources default to `test`.
- Bad, because moving the repo needs a new release.

**Home config file**
- Bad, because one more file to keep in sync, for a path that never moves.

## Consequences

- Good: `pnpm aletheia` and a bare `node src/shell/cli/bin.ts` both stay on `test`.
- Bad / cost: the release is tied to the repo path it was built from.

## Confirmation

CLI tests through `main()` cover 000-US1-AS3 and AS4; the release smoke run checks the built
entry's `--version`.
