# 06: Spike Zod Mini for further bundle reduction

**What to build:** Evaluate whether replacing standard Zod with Zod Mini in the public form runtime reduces bundle size without breaking validation or react-hook-form integration.

**Blocked by:** 05.

**Status:** done

- [x] Spike Zod Mini for the form builder runtime schemas (implemented on the current optimization branch).
- [x] Verify `@hookform/resolvers/zod` compatibility with the installed Zod version.
- [x] Measure bundle size before and after the spike.
- [x] Document which schemas can be migrated to Mini syntax and which cannot.
- [x] Decide whether to proceed with a full migration or discard the spike.

## Notes

**Decision: proceed with the public-facing client migration; do not migrate admin/server schemas.** The migration is implemented and measured, not discarded. The form builder's `propertiesSchema` files are the one admin-side exception because they share a module with the runtime `buildSchema` functions.

Why the runtime-only change was not enough: the analyzer showed classic Zod and all 62 locale modules in the client graph for `/`, `/shop/*`, and `/sign-in`. Turbopack does not shake the classic entry point's locale re-export, so migrating only the builder `buildSchema` functions would have added Mini next to classic Zod with no saving. The public schemas, dynamic form runner, sign-in schema, and builder schemas were migrated together.

The home page imported `HomeReviewsView` through `src/modules/reviews/index.ts`, whose admin exports pulled admin review views and the classic-Zod review schema into `/`. The barrel now exposes only public review components and the admin reviews page imports its views directly. This removed classic Zod from `/` without migrating admin schemas.

`@hookform/resolvers/zod` 5.9.1 is compatible with Zod 4 Mini. It ships a dedicated `zod-v4-mini` test suite; `src/modules/forms/builder/__tests__/zod-mini-runtime.test.ts` verifies the installed combination maps Mini issues to RHF field errors for text, textarea, select, checkbox, upload, contact, and free-download schemas, and asserts resolver type inference for a representative Mini schema.

Mini cannot be adopted mechanically everywhere: object schemas no longer expose `.min()`, `.max()`, `.optional()`, `.default()`, `.refine()`, `.extend()`, or `.pick()` as methods. Those become `z.minLength()`, `z.maxLength()`, `z.optional()`, `z._default()`, `z.refine()`, `z.extend()`, and `z.pick()`. Public schemas and the form builder field schemas (whose `propertiesSchema` shares a module with the runtime `buildSchema`) were migrated; admin-only layout/display properties schemas, admin schemas with heavy `.extend()`/`.pick()` chains (notably shop products), and server/tRPC schemas stay on classic Zod.

Turbopack analyzer deltas against the committed baseline:

| Route | Before | After | Delta |
| --- | ---: | ---: | ---: |
| `/` | 688.3 KiB | 439.1 KiB | -249.3 KiB (-36.2%) |
| `/sign-in` | 409.1 KiB | 306.3 KiB | -102.7 KiB (-25.1%) |
| `/shop` | 1.09 MiB | 1.08 MiB | -9.6 KiB (-0.9%) |
| `/blog/[slug]` | 348.9 KiB | 348.9 KiB | 0 |
| `/shop/checkout` | 343.8 KiB | 343.8 KiB | 0 |

`/` now carries no classic Zod and no locale modules; only Mini plus the shared core remains. `/sign-in` retains a small classic Zod slice from the auth client. `/shop/*` still carries classic Zod because admin shop schemas share its client chunk; removing that would require migrating the admin shop schemas and their consumers, which is out of scope.

The bundle baseline was intentionally not refreshed in this change, per `docs/performance/bundle-budget.md`; refresh it after merge so future PR deltas stay meaningful.

Verification:

- `npx tsc --noEmit` passes.
- Targeted: `npx vitest run "src/schemas/__tests__/public-forms.test.ts" "src/modules/forms/builder/__tests__/zod-mini-runtime.test.ts" "src/modules/forms/builder/__tests__/registry.test.tsx"`.
- Full suite: `npm run test:run` — 181 files, 1475 tests passed.
- `npm run bundle:analyze` completes and `npm run bundle:budget` reports every route within budget.
- `npm run lint` still reports the repository's pre-existing 41 errors; no new lint errors were introduced in the touched files.
- No Lighthouse/PageSpeed run was captured in this environment; compare mobile + desktop before/after per the spec's testing decisions.
- Decision record: `docs/adr/0030-zod-mini-for-public-client-forms.md`.
