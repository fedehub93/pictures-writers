---
Status: done
Type: task
Blocked by: 04, 05
---

# Create header-specific Puck blocks: Brand, AnnouncementBar and SearchBar

## Goal

Provide the blocks needed to compose the Header region.

## Acceptance criteria

- [x] `src/puck/blocks/Brand/` renders the site logo and/or name from Settings. Props: `showLogo`, `showSiteName`, `customText`, `customLogoUrl`.
- [x] `src/puck/blocks/AnnouncementBar/` renders a thin banner. Props: `text`, `link` (SmartLink), `backgroundColor`, `textColor`, `dismissible`.
- [x] `src/puck/blocks/SearchBar/` wraps the existing public search UI as a Puck block. Props: `placeholder`, `variant`.
- [x] AnnouncementBar and SearchBar are available in the Header palette only.

## Hints

- For `Brand`, use the existing `Settings.logoUrl` and `Settings.siteName`.
- For `SearchBar`, import the existing search component; make it self-contained.
- Keep `AnnouncementBar` simple: if `dismissible` is true, store dismissal in `localStorage`.

## Out of scope

- `NavbarBlock`; covered by ticket 09.

## Notes

- **Brand was delivered by ticket 06.** It reads `siteName`/`logoUrl` from Installation settings through `BrandServer` and exposes `showLogo`, `showSiteName`, `customText`, `customLogoUrl`. Ticket 06 pulled it forward because the footer's brand column needed it, so it lives in `SHARED_REGION_COMPONENTS` (Header + Footer) rather than the header-only list. That supersedes the "header palette only" wording for Brand; the spec and ticket 08 predate the footer decision.
- **AnnouncementBar** (`src/puck/blocks/AnnouncementBar/`) is a thin `min-h-8` banner. `text` is the banner copy, `link` uses a `LinkField` created with `showLabel: false` (the banner renders its own copy, so a label control would be dead UI), and the colors use the shared `buildColorOptions` helper from `puck/constants.ts`. The whole widget is a client component because dismissal is client state.
- AnnouncementBar reuses `InlineSmartLink`, which now accepts `children`. A broken/unresolved entity link therefore renders the banner text as plain text instead of an anchor, and external links keep `target`/`rel` handling in one place.
- Dismissal is stored under `puck:announcement-bar:dismissed:<blockId>:<contentHash>`. Including a hash of the text means rewording the announcement shows it again to returning visitors who closed the previous copy. The state is read with `useSyncExternalStore`, so the server snapshot is always visible and there is no hydration mismatch. The close button is runtime-only: in the Puck canvas the banner stays visible and editable even if the same browser dismissed it on the public site.
- **SearchBar** (`src/puck/blocks/SearchBar/`) wraps `src/shared/components/search/search-box.tsx`, a self-contained client component extracted from the sidebar widget. It owns the debounce, the `/api/posts` infinite query and the result rendering. `variant` is `inline` (input + results below) or `compact` (icon button opening the search in a popover). Both `WidgetSearchBox` (sidebar) and the legacy navbar search panel now delegate to it, so there is one search implementation instead of three. The static `Navbar` itself is still kept in source until the Pictures Writers production cutover, per the spec.
- Results are only shown once the debounced query exists, so the panel does not flash "No results" during the debounce; a failed request shows a dedicated "Search unavailable" message.
- Palette wiring: `AnnouncementBar` and `SearchBar` were added to `HEADER_REGION_COMPONENTS` in `region-palettes.ts`, to `RENDER_COMPONENT_NAMES` and `regionOnlyRenderComponentConfigs` in `render-config.tsx`, to `editorComponentConfigs` in `custom-config.tsx`, and to a new "Header" category in `region-editor-config.tsx` (ready for `NavbarBlock` in ticket 09). They are absent from `FOOTER_REGION_COMPONENTS`, `pageRenderConfig` and the page editor config.
- Tests: `announcement-bar-block.test.tsx` covers copy, colors, resolved/broken links, the dismiss button, and editor visibility; `announcement-bar-storage.test.ts` covers the namespaced/content-hashed key, same-tab notifications and blocked storage; `search-bar-block.test.tsx` covers both variants, the editor defaults and the page-palette exclusion. `region-render-config.test.ts` and `region-editor-config.test.ts` lock the Header-only palettes in both directions, including the editor "Header" category. `npx tsc --noEmit` clean; targeted ESLint clean (only the pre-existing `any` warnings in `render-config.tsx`). Full suite: 213 files / 1763 tests.
