# 01: Media header on a single control row

**What to build:** The Media page header stops stacking the search above the create/upload actions. Under the unchanged "Media" title row, one control row holds New Folder and Upload Media at the left and the search at the right, so the page spends less height on chrome and the search is easy to reach without spanning the whole content width.

**Blocked by:** None (can start immediately)

**Status:** done

## Decisions

- The title row stays as it is; only the control row changes.
- The search takes the right-hand side at a wide but bounded width, and grows to its own full-width line under the actions when the row cannot hold both.
- The rehome banner keeps its place, full width, directly under the control row.
- No search behaviour changes: the debounce, the reset to the first block on edit, and the placeholder stay.

## Checklist

- [x] The "Media" title stays on its own row; no page count is added.
- [x] One control row renders New Folder and Upload Media at the left and the search at the right.
- [x] The search is wide but bounded (`w-full max-w-lg ml-auto`) and keeps the "Search by name" placeholder and its debounce.
- [x] Below the small breakpoint the search wraps onto its own full-width line under the actions, which stay a single group.
- [x] Archived still hides New Folder and Upload and still shows the search.
- [ ] The rehome banner is still full width directly under the control row.
- [x] No other page behaviour changes; verified visually in the browser probe.
- [x] `npm run lint`, `npm run typecheck` and the test suite pass.

## Comments

- 2026-11-26 — Landed in `9be2bda4` (`feat(media): put the header actions and search on one row`).
  - `MediaListHeader` now renders one control row: New Folder and Upload Media as a single group on the left, the search in a `w-full max-w-lg ml-auto` wrapper on the right. The actions group keeps `flex-wrap` so the two buttons stack rather than overflow on an ultra-narrow screen. `MediaSearchFilter` is untouched, so the "Search by name" placeholder, the debounce and the reset to the first block stay. Archived still hides both actions and keeps the search.
  - Browser probe (`/admin/media/` and `?view=archived`, agent environment, headless Chrome through `withSession`):
    - 1600×1000 (1300 px row): title row at y 80–112; one control row at y 132–166 with the actions at x 278–546 and the search at x 1066–1578 — 512 px wide, right edge flush with the row.
    - 900×800 (600 px row): the actions keep y 132–166; the search takes its own line at y 180–213, 512 px wide and right-aligned (x 366–878). `max-w-lg` bounds it above 512 px of row width; below that it is full width.
    - 390×844: the actions stay one group at y 132–166; the search wraps to y 180–213 at the full row width (346 px).
    - Archived at 1600, 900 and 390: no New Folder or Upload, search present — right-aligned at 512 px on the wider two, full width on phone.
  - Not run: the rehome banner check. The agent database has no pending files on a non-active driver, so `MediaRehomePanel` renders `null` and there is nothing to measure. The banner's markup and its position as the control row's next sibling (full width) are unchanged.
  - `npm run lint`: 0 errors (250 pre-existing warnings). `npm run typecheck`: clean. `npm run test:run`: 306 files / 2773 tests passed.
