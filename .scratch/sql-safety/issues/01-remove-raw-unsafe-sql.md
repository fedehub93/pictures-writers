---
Status: done
Type: task
---

# Remove interpolated SQL from root locking and block raw-unsafe helpers

## Goal

Eliminate the only interpolated SQL identifier in production code and make sure
`$queryRawUnsafe` / `$executeRawUnsafe` / `Prisma.raw` cannot silently re-enter
the codebase.

## Context

`src/shared/lib/lock-root.ts` builds `SELECT id FROM "${table}" ... FOR UPDATE`
and runs it through `$queryRawUnsafe`. It is safe today: `table` is a closed
TypeScript union and every call site passes a literal, while `rootId` is bound
as `$1`. The risk is future misuse: TypeScript unions are erased at runtime, so
a single call site passing request data would become an injection vector.

## Acceptance criteria

- [x] `acquireRootLock` uses an exhaustive `switch` over `RootLockTable` with one
      static tagged-template query per table. No identifier is interpolated.
- [x] The `switch` has a `never` exhaustiveness guard so adding a union member
      fails type-checking until a case is added.
- [x] ESLint rejects `$queryRawUnsafe`, `$executeRawUnsafe` and `Prisma.raw`.
- [x] The one existing test usage (`read-state-backfill.test.ts`, which replays
      migration SQL read from disk) carries an inline, justified
      `eslint-disable-next-line`.
- [x] `AGENTS.md` documents the raw SQL rule (values parameterized, identifiers
      from an allow-list, unsafe helpers banned).
- [x] `npx tsc --noEmit`, ESLint on the touched files, and the affected test
      suites pass.

## Out of scope

- UUID validation at the tRPC boundary (separate error-hygiene improvement).
- Rewriting existing safe `$queryRaw` tagged templates.
- Any change to the Site region ticket already merged.

## Notes

- The `switch` is deliberately explicit rather than a table-name allow-list: the
  identifier is hardcoded per branch, so there is no runtime string to validate.
  The `never` guard turns "forgot to add a case" into a type error.
- `$queryRawUnsafe` with bound values is not insecure by itself; it is banned
  because it makes the dangerous pattern (interpolated SQL) the easy one. The
  tagged templates are already the convention everywhere else in the repo.
- A blanket ban has one escape hatch by design: `eslint-disable-next-line` plus a
  written justification. The migration-replay test is the only current exception:
  its SQL comes from a committed file, not from request input.
- The new rule also catches `Prisma.raw`, because otherwise the ban would be
  trivially bypassed. `Prisma.sql` with `${}` values remains allowed and safe.
- `AGENTS.md` gained a "Database > Raw SQL" subsection so reviewers can cite the
  rule.

## Comments

Implemented in commit `f52e2aab`.

- `src/shared/lib/lock-root.ts`: four static tagged-template queries behind an
  exhaustive `switch`, plus a `never` guard.
- `eslint.config.mjs`: `no-restricted-syntax` errors for `$queryRawUnsafe`,
  `$executeRawUnsafe` and `Prisma.raw`, pointing at the AGENTS.md section.
- `src/modules/mails/conversations/server/__tests__/read-state-backfill.test.ts`:
  the only other occurrence now carries a justified inline disable.
- `AGENTS.md`: "Database > Raw SQL" documents parameterized values and the
  identifier allow-list rule.
- Verified the rule fires against a scratch input for both `$queryRawUnsafe` and
  `Prisma.raw`. `npx tsc --noEmit` clean; ESLint clean on every touched file;
  affected suites (pages, posts, products, site-regions, read-state backfill)
  pass; full suite `npm run test:run` passes (198 files / 1680 tests).

