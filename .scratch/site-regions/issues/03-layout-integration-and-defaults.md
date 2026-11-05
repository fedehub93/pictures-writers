---
Status: done
Type: task
Blocked by: 02
---

# Integrate Site regions into the public layout and add generic defaults

## Goal

Make the public layout read header/footer from Site regions and provide a generic default fallback.

## Acceptance criteria

- [x] `src/app/(home)/layout.tsx` fetches live `HEADER` and `FOOTER` regions server-side.
- [x] If a region is missing, render a generic default defined in `src/modules/site-regions/lib/default-regions.ts`.
- [x] Default header contains only a `Brand` block.
- [x] Default footer contains only a `Copyright` block.
- [x] The existing static `<Navbar />` and `<Footer />` components are **not imported or rendered** in this layout, but their source files are **not deleted**.
- [x] Rendering uses `<PuckRender>` with the correct region config.

## Hints

- Use `unstable_cache` or a similar short cache for the server query, but keep revalidation on publish.
- The `main` padding logic (`pt-32 md:pt-28`) may need adjustment if the header height changes.

## Out of scope

- New Puck blocks; covered by later tickets.

## Notes

- `getCachedLiveRegionByKey` wraps the existing `getLiveRegionByKey` in `unstable_cache` (tag `site-regions`, 60s TTL). Publish and unpublish now revalidate that tag together with `revalidatePath("/", "layout")`; ADR-0001 records that the shared layout query is the trigger it was waiting for.
- `resolveRegionPuckData` only falls back when the region is absent, never published, or its live version has no document. A published empty document is treated as an intentional headerless/footerless site.
- The header/footer are now in normal flow, so the fixed-navbar `pt-32 md:pt-28` offset was removed from `main`. A future fixed header block is responsible for reserving its own space.
- `PuckRender` now accepts an optional `config` (defaults to the page palette). `renderConfigForRegion` supplies the Header/Footer subset from `src/puck/region-render-config.ts`.
- **Sequencing caveat**: the generic defaults reference `Brand` and `Copyright`, which are added by tickets 08 and 06. Until those land, Puck skips the unknown component types, so the fallback header/footer are present in the data but render empty. The static `Navbar`/`Footer` are no longer rendered, so this branch should not ship to production before those blocks exist. This is deliberate: ticket 03 is explicitly out of scope for new blocks.
- Tests: `default-regions.test.ts` covers both default documents, fresh-copy behaviour and the fallback decision; `region-render-config.test.ts` locks the per-region palettes. The existing site-region suite now asserts tag invalidation on publish/unpublish.

## Comments

Implemented in this commit.

- Added `src/modules/site-regions/lib/default-regions.ts` with `getDefaultRegionPuckData` and `resolveRegionPuckData`.
- Added `src/puck/region-render-config.ts` with `renderConfigForRegion` and the Header/Footer component palettes; extracted the shared render map from `src/puck/render-config.tsx`.
- Wired the public layout to read both regions server-side, fall back to the generic defaults, and render them with `<PuckRender>`.
- `npx tsc --noEmit` clean; ESLint clean on touched files (only the repo's existing `no-explicit-any` warnings); full suite `npm run test:run` passes (200 files / 1690 tests).
- `npm run build` compiles and type-checks but cannot finish prerendering against an empty database (`/blog` assumes at least one post). The `.env` database is missing the SiteRegion migration; the documented production build runs `prisma migrate deploy` first.
- Code review (standards + spec, parallel) findings acted on: deduplicated the region palette base, renamed the render config map, moved the duplicated revalidation pair into one helper, imported the cache tag in tests, and documented the ADR-0001 cache decision.
