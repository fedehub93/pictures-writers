# 04: Reduce explicit prefetch and document third-party constraints

**What to build:** Remove explicit route prefetching from shared navigation to reduce initial RSC requests and chunk downloads, while keeping GTM and Iubenda behavior compliant.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Remove explicit `prefetch` props or calls from navbar, footer, sidebar, and public widgets.
- [x] Confirm that GTM still loads immediately for consent mode v2 and early events.
- [x] Confirm that any Iubenda script using `beforeInteractive` remains unchanged.
- [ ] Measure reduction in initial RSC requests and extraneous route chunks.
- [x] Document in the spec/ADR why these scripts cannot be deferred or removed.

## Notes

Explicit `prefetch` was removed from every public-facing link, not only the shared chrome: navbar (including mobile search), footer, sidebar widgets, `latest-news`, `services`, `services-cta`, blog post cards and pagination, product list/webinar cards, and the TipTap link renderer. Links now use the App Router default `prefetch="auto"`, so static routes still prefetch in full and dynamic routes only prefetch down to the nearest `loading.js` boundary. Admin tRPC server prefetches (`src/**/server/prefetch.ts`) are unrelated and untouched. The Puck link block keeps its intentional `prefetch={false}`.

A regression test (`src/app/(home)/_components/__tests__/navigation-prefetch.test.ts`) scans the public component directories and fails if a `<Link>`/`<NextLink>` opts back into explicit prefetching. Intentional `prefetch={false}` opt-outs remain allowed.

Third-party behavior is unchanged:

- GTM is still rendered in `src/app/(home)/layout.tsx` through `@next/third-parties/google` `<GoogleTagManager>`, which uses `next/script`'s default `afterInteractive` strategy. Its timing is unchanged; deferring it to `lazyOnload` or removing it would delay when GTM and the consent-mode/analytics tags it controls fire.
- Iubenda still loads through `AppScripts` (`src/shared/components/scripts.tsx`) from `settings.scripts`, preserving the per-script `strategy` (including `beforeInteractive`) stored in the database. A test (`src/shared/components/__tests__/scripts.test.tsx`) locks in that strategy passthrough. Moving or deferring those scripts is a GDPR/consent decision and was left unchanged.

The rationale is recorded in `docs/adr/0028-no-explicit-prefetch-and-third-party-scripts.md`.

Verification:

- `npx tsc --noEmit` passes.
- Targeted test: `npx vitest run "src/app/(home)/_components/__tests__/navigation-prefetch.test.ts"` passes.
- Static measurement: 33 explicit `prefetch` occurrences removed across 19 public files. A runtime Lighthouse/network measurement of initial RSC requests and route chunks needs a production deployment or preview and was not captured in this environment; compare before/after request counts per the spec's testing decisions.
