# 0021. The profile is a shared file outside the repo

- **Status:** accepted
- **Date:** 2026-11-16
- **Deciders:** Angelo
- **Supersedes:** [0015](0015-the-profile-is-an-untracked-file-read-in-place.md)
- **Superseded by:** —
- **Extends:** [0011](0011-the-release-copies-the-global-skill.md)

## Context and problem statement

ADR-0015 put `PROFILE.md` at the repo root, ignored by git, and the skills read it at
`~/me/aletheia/PROFILE.md`. Angelo's tutor needs the same facts: his level by area, the domains
he draws analogies from and how he learns. Two copies drift: a line approved during a review
would never reach the tutor. Where does the one profile live, so Aletheia and the tutor read
the same file?

## Decision drivers

- One profile: a line approved in Aletheia counts for the tutor at once, and the other way round.
- An approved change shapes the next draft, in any repo, with no commit, merge or release
  (002 SC-005).
- Claude changes it only after Angelo approves the exact line (constitution IX).
- The profile is Angelo's own text; it need not be pushed.

## Considered options

1. `~/.config/angelo/PROFILE.md`, outside every repo, read and edited in place
2. Kept at the aletheia repo root; the tutor reads it from there
3. One copy for each

## Decision outcome

Chosen option: **1**, by Angelo. `az-aletheia-add`, `aletheia-review` and `aletheia-prune` read
`~/.config/angelo/PROFILE.md`; add and review edit it only after Angelo approves the exact line,
a level or role under `## Nivel por área`, how he learns under `## Cómo aprendo`, and touch
nothing else, since the tutor reads the same file. The repo no longer holds a profile:
`/PROFILE.md` leaves `.gitignore`, and 002-US2-AS2, which checked that line, is removed. The
profile is still the one thing the global skill does not take from the release.

### Pros and cons of the options

**Shared, in `~/.config/angelo`**
- Good, because one approved line reaches Aletheia and the tutor, with no copy to keep in sync.
- Good, because no skill depends on a repo's path, and `git clean -fdx` or a fresh clone no
  longer loses it.
- Bad, because it still has no history and no backup, and part of it is the tutor's: a skill
  that rewrites more than the approved line breaks the tutor.

**At the aletheia repo root**
- Good, because nothing in Aletheia changes.
- Bad, because the tutor would depend on Aletheia's path, and the profile is not Aletheia's
  alone.

**One copy for each**
- Good, because neither tool can break the other's file.
- Bad, because a level stated in a review never reaches the tutor; the copies drift.

## Consequences

- Good: a line Angelo approves in a review is what the tutor reads next.
- Bad / cost: a lost profile is rewritten by hand; the skills say so in one line and carry on
  without it. Each eval still freezes the profile it was written with (constitution 1.6.0).
- Bad / cost: the old `~/me/aletheia/PROFILE.md` is no longer ignored, so `git status` lists it
  and `pnpm release` refuses the tree until Angelo deletes it, after the merge and right before
  that release.

## Confirmation

No test: where a file outside the repo lives and which line a skill edits is the skills' to
follow, checked by use (ADR-0020). 002-US2-AS1 and 002-US3-AS1 stay traced by spec 002's
quickstart, which keeps the old path as that slice's history.
