# 0009. Backups in the data folder, not iCloud Drive

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

Spec US3 and constitution 1.3.0 send `aletheia backup` to `aletheia-backups/` in iCloud Drive,
so losing the Mac never loses the deck. Angelo wants nothing from aletheia in iCloud. iCloud
also has costs of its own: `backup` refuses when iCloud Drive is missing, the copies leave the
machine, and a sync service holds files the CLI is still writing. ADR-0008 moved the stores
out of the repo for the installed release; where do the backups go?

## Decision drivers

- Nothing aletheia writes lands in iCloud Drive or leaves the Mac (the CLI makes no network
  calls, and now no synced folder either).
- A backup still protects against a bad migration or a corrupted store, and still runs before
  any migration in `prod`.
- Development copies stay apart from the real deck's, as ADR-0008 keeps the stores apart.
- Tests never write a backup outside a temp folder (INV-01).

## Considered options

1. iCloud Drive's `aletheia-backups/` (status quo)
2. `backups/` in each entry's data folder: `~/.aletheia/backups/` installed, the repo's
   `data/backups/` from the sources
3. `~/.aletheia/backups/` for both entries
4. `ALETHEIA_BACKUP_DIR`, an absolute path, defaulting to option 2

## Decision outcome

Chosen option: **2** (Angelo chose `~/.aletheia/backups/`, 2026-11-09; the sources follow
ADR-0008's split). A backup writes `<data folder>/backups/<env>-<instant>.sqlite`, creating the
folder on first use, and keeps the newest 5 copies of its env. A store from `ALETHEIA_DB` is
backed up into the entry's data folder as `custom-…`. Under vitest neither entry has a data
folder, so backups are refused (INV-01), with the same message as before.

### Pros and cons of the options

**iCloud Drive**
- Good, because losing the Mac does not lose the deck.
- Bad, because the deck leaves the machine and `backup` depends on iCloud Drive being there.

**`backups/` in each entry's data folder**
- Good, because nothing leaves the Mac and `backup` needs no other service.
- Good, because one setting, the data folder, decides where stores and copies live, and its
  absence under vitest disables both.
- Good, because development copies stay next to the development stores.
- Bad, because losing the Mac or its disk loses the deck and its copies together; an
  off-machine copy is now Time Machine's job, which covers `~/.aletheia/` by default.

**`~/.aletheia/backups/` for both entries**
- Good, because there is one backups folder.
- Bad, because `test-…` copies from development share a folder with the real deck's.

**`ALETHEIA_BACKUP_DIR`**
- Good, because an external disk or another folder can hold the copies.
- Bad, because it adds a variable, its validation and its errors to the contract for a need
  nobody has yet.

## Consequences

- Good: `error: iCloud Drive not found at <path>` disappears; a backup fails only when its
  folder cannot be created or written.
- Good: `CliContext` drops `backupRoot`; the data folder is the only switch.
- Bad / cost: the spec's "losing the Mac never loses the deck" no longer holds by itself.
- Bad / cost: `git clean -x` in the repo deletes the development copies with `data/` (test
  data, which can be rebuilt).

## Confirmation

`main()` tests write backups into an injected data folder's `backups/` (000-US3-AS1…AS3) and
refuse them with no data folder (INV-01); the context tests already cover each entry's data
folder and its absence under vitest.
