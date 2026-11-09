# 0007. One folder per module, with types, errors and constants files

- **Status:** accepted
- **Date:** 2026-11-09
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —
- **Extends:** [0004](0004-functional-core-and-imperative-shell-in-concept-folders.md)

## Context and problem statement

ADR-0004 fixed the units (`src/core/<concept>`, `src/shell/<adapter>/<concept>`) but not what
sits inside them. Halfway through slice 0 a single file already held types, the logic, the
error messages as strings and literals such as `'main'` and `1`, and one type was declared
twice (`RunResult` in the release and in the fake runner). How is a unit organized inside, and
how are errors represented?

## Decision drivers

- A file holds one kind of thing; the folder shows what a module declares.
- Each type is declared once and imported everywhere else.
- Errors are values with a type and data, not strings assembled in logic.
- No literal whose meaning is a convention stays inline.
- No new tooling (no lint rule enforces this for now).

## Considered options

1. Keep flat units and split only when a file grows
2. One folder per module with `.types.ts`, `.errors.ts`, `.constants.ts` and `.schema.ts`
   beside the logic and its test

## Decision outcome

Chosen option: **2**, as written in
[the structure design](../plans/2026-11-09-structure-design.md):

- A module is `<name>/` with `<name>.ts`, `<name>.test.ts`, `<name>.types.ts`,
  `<name>.errors.ts`, `<name>.constants.ts` and `<name>.schema.ts`, each only when needed. A
  module with neither test nor any of those files (an entry point) stays a loose file. A
  concept with one module is its own folder.
- Every `type` and `interface` lives in a `.types.ts`; types derived from zod or Drizzle
  schemas are declared there from the `.schema.ts`.
- Every failure is an error class in the `.errors.ts` of the module that throws it, built from
  its data into the contract's message. The CLI edge turns any thrown error into
  `error: <message>`; `release()` catches `ReleaseError` and rethrows the rest.
- Named constants (`as const` objects, since `erasableSyntaxOnly` forbids `enum`) replace
  literals whose meaning is a convention. Tests keep the contract's literal text.
- Barrels stay as ADR-0004 says: one `index.ts` per unit, none per module.

### Pros and cons of the options

**Flat units**
- Good, because fewer folders and files.
- Bad, because the clutter that prompted this decision comes back with every slice.

**One folder per module**
- Good, because what a module declares is visible from its folder, and duplicated types and
  string errors have no place to hide.
- Bad, because more files and deeper paths (`src/shell/cli/invocation/context/context.ts`).

## Consequences

- Good: slice 1 adds modules by copying the shape; review checks a folder, not a file.
- Bad / cost: the rules are checked in review, not by lint; a later ADR can add local rules.

## Confirmation

Phase 4b of `specs/000-skeleton/tasks.md` moves the existing code; `pnpm check` stays green
with unchanged assertions.
