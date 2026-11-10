# 0011. The release copies the global skill

- **Status:** proposed
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0005](0005-release-as-a-rolldown-bundle-installed-globally.md),
  [0008](0008-installed-data-in-a-home-dotfolder-development-data-in-the-repo.md)

## Context and problem statement

`az-aletheia-add` is the one global skill: Claude loads it from `~/.claude/skills/` in any
repo, and it calls the installed `aletheia`. Its source lives in this repo. If the skill Claude
loads follows the working tree while the CLI it calls is the last release, a draft skill can
call a command the release does not have. How does the skill reach `~/.claude/skills/` so that
it always matches the installed CLI?

## Decision drivers

- The skill and the CLI come from the same release (constitution, Technology Constraints).
- A failed release leaves the previous skill whole (001-US1-AS7).
- No test writes under `~/.aletheia/` or `~/.claude/` (INV-01).
- The release owns nothing under `~/.claude/`, which belongs to Angelo's dotfiles.

## Considered options

1. A symlink from `~/.claude/skills/` into the repo
2. A symlink into pnpm's global install folder, with the skill shipped in the tarball
3. `pnpm release` copies the skill into `~/.aletheia/skills/`; a symlink in `~/.claude/skills/`
   points there, created once by Angelo

## Decision outcome

Chosen option: **3**. The source is `skills/az-aletheia-add/` at the repo root, not under
`.claude/skills/`, where it would also load in this repo from the working tree. After the
global install and its PATH check, `release()` copies that folder to
`<skills folder>/az-aletheia-add.partial`, swaps it for the previous copy and prints the path.
The skills folder (`~/.aletheia/skills/`) is injected; the release entry passes none under
vitest and the release refuses to run without one.

### Pros and cons of the options

**Link into the repo**
- Bad, because the skill follows the working tree and the CLI does not.

**Link into pnpm's folder**
- Bad, because pnpm owns that path, and it changes between pnpm majors and on every install.

**Copy at release**
- Good, because one command moves the CLI and the skill together, and the link never changes.
- Bad, because a release that installs the CLI and then fails to copy leaves an older skill
  beside a newer CLI until the next run.

## Consequences

- Good: editing the skill in the repo never changes what Claude loads elsewhere.
- Bad / cost: one manual `ln -s`, given in the quickstart; a skill fix needs a release.

## Confirmation

The release tests cover 001-US1-AS7 over temp folders and INV-01 for the refusal under vitest.
