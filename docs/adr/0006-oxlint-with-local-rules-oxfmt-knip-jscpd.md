# 0006. oxlint with local rules, oxfmt, knip and jscpd

- **Status:** accepted
- **Date:** 2026-11-08
- **Deciders:** Angelo
- **Supersedes:** —
- **Superseded by:** —

## Context and problem statement

The design names oxlint, oxfmt, knip and jscpd and asks whether oxlint covers what diarium
enforces with eslint: no comments, file naming, sonarjs-style checks, and the core boundary
(design §12). How are these rules enforced?

## Decision drivers

- No comments in code (constitution, Technology Constraints).
- `src/core` imports no `node:*`; only `src/shell/db` knows `node:sqlite` and `drizzle-orm`
  (Constitution III).
- Kebab-case file names and a complexity limit, as in diarium.

## Considered options

1. oxlint built-in rules only
2. oxlint plus JS plugins: a local `no-comments` rule and `eslint-plugin-sonarjs`
3. eslint, as in diarium

## Decision outcome

Chosen option: **2**. oxlint has no rule against every comment, and
`eslint-plugin-no-comments` flags the shebang and its fix deletes it. A local rule in
`tools/lint/no-comments.ts` reports every comment except the shebang, with no exception for
disable directives. Built-ins cover the rest: `unicorn/filename-case` (kebab-case),
`import/no-nodejs-modules` and `no-restricted-imports` in a `src/core/**` override, and
`no-restricted-imports` for the database outside `src/shell/db/**`.
`sonarjs/cognitive-complexity` (15) comes from `eslint-plugin-sonarjs` loaded as a JS plugin.
`oxfmt --check` covers code and config files, not Markdown. `knip` and `jscpd` run as in
diarium.

### Pros and cons of the options

**Built-ins only**
- Bad, because no rule forbids comments and none measures cognitive complexity.

**oxlint plus JS plugins**
- Good, because every rule diarium enforces is covered, at oxlint's speed.
- Bad, because JS plugins are alpha in oxlint; a breaking change would hit two rules.

**eslint**
- Bad, because the design chose oxlint.

## Consequences

- Good: one config file, `.oxlintrc.json`, and one local rule.
- Bad / cost: no `oxlint-disable` escape hatch; a rule that must not apply somewhere is changed
  in the config, in a reviewed commit.

## Confirmation

`tests/lint.test.ts` runs oxlint on a temp copy of the config with a forbidden import and a
comment (000-US5-AS2).
