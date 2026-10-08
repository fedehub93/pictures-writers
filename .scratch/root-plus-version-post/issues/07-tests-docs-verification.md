# 07: Tests, docs, and verification

**What to build:** The Post migration is covered by integration tests and the full suite is green, with the domain docs finalized.

**Blocked by:** 06 — Admin UI and public rendering.

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Integration tests on `postsRouter` cover create, in-place edit, fork-on-live edit, publish, unpublish, concurrent publish, `getVersions`, scheduling, delete, and `getMany` (default order, explicit sorts, search).
- [ ] A migration test asserts one root per logical post, reused ids, repointed editorial relations/SEO, and resolved slug collisions.
- [ ] Existing post tests that assumed the legacy model are updated or removed.
- [ ] `CONTEXT.md` states *Post* = logical identity, *Post version* = revision, and the corrected *Root*/*Version* definitions.
- [ ] `content-versioning-debt/note.md` drops `Post` from the legacy list.
- [ ] An ADR (0013) records the Post Root + Version decision.
- [ ] `npm run build`, `npm run lint`, and `npm run test:run` pass; `npx tsc --noEmit` is clean.

## Notes

See the parent spec at `.scratch/root-plus-version-post/spec.md`. Model the integration tests on `src/modules/pages/server/__tests__/page-root-version.test.ts`.
