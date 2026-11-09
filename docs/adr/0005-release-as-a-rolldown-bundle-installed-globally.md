# 0005. Release as a Rolldown bundle installed globally

- **Status:** proposed
- **Date:** 2026-11-08
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

Diarium's installed bin runs the working tree (its ADR-0016), so half-built code and
half-written migrations can reach `prod`. Angelo wants to build and install a release, as if
it were published to npm, to tell apart what is released from what is in development (spec
000, Clarifications). How is the release built and installed?

## Decision drivers

- The installed `aletheia` runs only what was released from a clean, green `main` (000-US2).
- The package needs nothing from the repo at runtime except `data/` (FR-001, FR-009).
- Development and tests keep running the sources directly (no build in the loop).
- Prefer a stable tool over a 0.x one (Constitution VI).

## Considered options

1. Copy the sources of `main` to a folder and point the bin at them (no build)
2. `tsc` emit to `dist/`, dependencies installed with the package
3. Rolldown bundle, packed and installed with `pnpm add -g <tarball>`
4. tsdown bundle, same install
5. esbuild bundle, same install

## Decision outcome

Chosen option: **3**. `pnpm release` calls Rolldown's API on `src/shell/cli/released.ts`
(platform node, ESM, `dist/aletheia.js`, shebang kept), injecting `__ALETHEIA_RELEASE__`
(`version`, `commit`, `repoRoot`) with `transform.define`. Libraries are inlined, so they are
`devDependencies`; `node:sqlite` stays external. `files` ships `dist` and `migrations`.
`pnpm pack` writes the tarball to `.release/`; the release smoke-runs it from a temp folder,
installs it with `pnpm add -g <absolute path>`, and checks `aletheia --version` from PATH.

### Pros and cons of the options

**Copy of the sources**
- Good, because what runs is exactly what was tested.
- Bad, because it does not mark a release the way a build does, which is what Angelo asked for.

**tsc emit**
- Bad, because no `define`, and every release installs the dependencies again.

**Rolldown**
- Good, because one file, no runtime dependencies, semver-stable since 1.0, tried in scratch
  with this exact stack.
- Bad, because the bundle is not byte-for-byte what the tests ran; the smoke run covers the
  packaging.

**tsdown**
- Good, because the same output (it wraps Rolldown).
- Bad, because 0.x with option renames, and library features an app does not need.

**esbuild**
- Bad, because twice the output size for no gain here.

## Consequences

- Good: editing the repo never changes the installed `aletheia`; `--version` names the commit.
- Bad / cost: a release is one more step after merging, and `pnpm link --global` is not an
  option (removed in pnpm 11).

## Confirmation

The release script's tests cover 000-US2-AS1 and AS2 with a fake command runner; 000-US2-AS3
is covered through `main()` with the source and the release contexts.
