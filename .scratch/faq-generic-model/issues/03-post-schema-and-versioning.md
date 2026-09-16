# 03: Add faqs to the post schema, versioning, and admin query

**What to build:**
Extend the post module to carry FAQ data: add `faqs` (array of `{ id?, question, answer, sort }`) to `postUpdateSchema` in `src/modules/blog/posts/schemas.ts`; in `src/modules/blog/posts/lib/create-new-version.ts` delete-and-create `Faq` rows against the correct version id in both branches (A: new CHANGED version post id; B: existing draft/scheduled post id); add `faqs { id, question, answer, sort }` (ordered by `sort asc`) to the `getLastByRootId` selection in `src/modules/blog/posts/server/procedures.ts` so the editor is seeded.

**Blocked by:** 01

**Status:** done

- [x] `postUpdateSchema.faqs` is typed and optional; `PostUpdateValues` includes it.
- [x] Branch A creates FAQ rows against the new CHANGED version's id; Branch B replaces rows on the existing id.
- [x] `getLastByRootId` returns the current version's FAQ list ordered by `sort asc`.

## Comments

- `postUpdateSchema.faqs` reuses the shared `faqItemsSchema` from `@/modules/faq` (`{ id?, question, answer, sort }`).
- `createNewVersion` loads `faqs: true` on the current version; Branch A copies the published FAQs into the new CHANGED version (or uses `input.faqs` when provided) and writes them against the new version id; Branch B deletes-and-recreates against the existing post id when `input.faqs` is provided, leaving rows untouched otherwise.
- `getLastByRootId` selects `faqs { id, question, answer, sort }` ordered by `sort asc`.
- Tests added in `src/modules/blog/posts/lib/__tests__/create-new-version-faqs.test.ts` covering FAQ creation in both branches, published-version isolation, fallback copy, untouched-draft behavior, and sort ordering. Verified via `npx tsc --noEmit`, targeted eslint, and the full vitest suite (241 tests passing).