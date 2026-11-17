# 03: Single-source the region palettes and categories

**What to build:** One region palette definition owns the named tuples for layout, brand, content, header-only and footer-only blocks. The Header and Footer editor palettes, the Header and Footer public render palettes and the editor categories all derive from those tuples. The region configuration modules are grouped in one region-focused area, and a test fails if an editor palette and the corresponding public render palette diverge.

**Blocked by:** 02.

**Status:** done

- [x] Each Site region's editor palette and public render palette expose exactly the same block names.
- [x] Editor categories derive from the same tuples and never list a block outside that region's palette.
- [x] Header-only blocks remain absent from the Footer and from pages; footer-only blocks remain absent from the Header and from pages.
- [x] An invariant test fails when an editor palette and the matching public render palette disagree.
- [x] The page palette remains explicit and unchanged.
- [x] Region palette and region config modules are grouped together.

## Implementation notes

- Added `src/puck/region/palettes.ts` as the single definition of the region segments: layout, brand, typography, media, content, header-only, footer-page and footer-only. The Header and Footer palettes are composed from those tuples, and `REGION_CATEGORY_DEFINITIONS` expresses each editor category as a view over the same tuples.
- `FOOTER_ONLY_COMPONENTS` is `LinkList` + `Copyright`; `Form` and `Separator` live in `FOOTER_PAGE_COMPONENTS` because the page palette also offers them. This keeps the footer-only blocks genuinely absent from both the Header and pages while preserving the current Footer palette.
- The editor and public render configs moved to `src/puck/region/editor-config.tsx` and `src/puck/region/render-config.ts`; the old `src/puck/region-*.ts(x)` modules were deleted and every import (home layout, site-region editor view, page config and tests) now points at the grouped area.
- Editor categories still filter against the region palette, so their membership and titles are unchanged while their component lists come from the shared tuples.
- Added `src/puck/__tests__/region-palettes.test.ts`: it asserts the editor and public render palettes have identical block names per region and that every entry is registered (a tuple name missing from either registry now fails), and it pins the derived category keys, titles and membership for both regions. The existing editor/render tests keep the header-only, footer-only and page-exclusion assertions.
- The page palette in `src/puck/config.ts` is untouched (only its `pickComponentConfigs` import path changed).
- Verification: `npx tsc --noEmit`, targeted `npx eslint` (0 errors; only the pre-existing `any` warnings in `render-config.tsx`), the region/editor/render pipeline test files and `npm run build` pass. A full `npm run test:run` was green earlier in this change (219 files / 1805 tests); the final rerun has one failure in `text-block.test.tsx` caused by concurrent, uncommitted Text-block work outside this ticket. Repository-wide `npm run lint` still reports the pre-existing errors noted in ticket 01.
