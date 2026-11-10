# 0015. The profile is an untracked file, read and edited in place

- **Status:** proposed
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0011](0011-the-release-copies-the-global-skill.md)

## Context and problem statement

`PROFILE.md` says what Angelo already knows, so `az-aletheia-add` can flag a draft as
`ya lo sabes por tu perfil` (spec 002). The global skill runs in any repo and comes from the
release (ADR-0011). Angelo talks about his level while reviewing, and wants Claude to offer the
change at that moment and the next draft to see it. Where does the profile live, and how does a
skill running in another repo read and change it?

## Decision drivers

- An approved change shapes the next draft, in any repo, with no commit, merge or release
  (SC-005).
- The profile is Angelo's own text; it need not be pushed.
- Claude changes it only after Angelo approves the exact line (constitution IX).
- No branch checkout or uncommitted edit changes what the skill reads.

## Considered options

1. Committed beside the skill, copied by the release
2. A table in the store behind `aletheia profile`
3. At the repo root, ignored by git, read and edited in place

## Decision outcome

Chosen option: **3**, by Angelo. `/PROFILE.md` is in `.gitignore`. `az-aletheia-add` reads and
edits `~/me/aletheia/PROFILE.md`; the review skill, which runs in the repo, reads and edits the
same file. The profile is the one thing the global skill does not take from the release.

### Pros and cons of the options

**Copied by the release**
- Good, because profile, skill and CLI come from one commit.
- Bad, because a change waits for a merge and a release.

**A table in the store**
- Good, because the CLI stays the only writer and backups cover it.
- Bad, because it needs a schema, two commands and an amendment for a short Spanish text.

**Untracked, in place**
- Good, because a change counts at once, and an ignored file is the same on every branch.
- Bad, because the global skill depends on the repo's path, and the file has no history and no
  backup: `git clean -fdx` or a fresh clone loses it.

## Consequences

- Good: Claude can keep the profile current in the middle of a review.
- Bad / cost: a lost profile is rewritten by hand; the skill says so in one line and drafts
  without it. Evals cannot rerun on every profile change, so each eval freezes the profile it
  was written with (constitution 1.6.0).

## Confirmation

002-US2-AS2 checks that git ignores `PROFILE.md`; 002-US2-AS1 and 002-US3-AS1 read the skill
files for the path and the approval.
