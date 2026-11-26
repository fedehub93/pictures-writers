# 06: Document the new library browsing and verify the whole feature

**What to build:** The Media documentation describes the page as it now behaves: one control row, no relational-reference copy, a two-row Recent preview, load-more instead of pagination in My Drive and Archived, and the sort selector with its URL contract. The feature is then verified end to end, including a browser probe for the behaviours the component tests deliberately do not cover.

**Blocked by:** 01, 02, 03, 04, 05

**Status:** done

## Decisions

- One documentation pass at the end, because the media document describes the page as a whole and would otherwise be edited in five conflicting places.
- The browser probe covers the behaviours with no automated seam: the scroll back to the top after a sort change, the selection reset when the scope changes, and the URL round-trip for search, folder and sort.
- The probe runs against the agent database, never the development one.

## Checklist

- [x] The media documentation states the single control row with the bounded search on the right.
- [x] It states that relational-reference information is no longer shown and that deletion is still refused while content uses a Media.
- [x] It states the Recent box's four-item preview, second-row reveal and eight-item cap, with no pagination or collapse.
- [x] It describes load-more in My Drive and Archived, its eight-item blocks, the spinner, the retry and the end state, and that the page number is no longer in the URL.
- [x] It describes the sort selector, the three orders, the URL parameter and the restart-on-change behaviour.
- [x] No documentation cites a path the repository no longer has: `npm run check:doc-citations` passes.
- [x] `npm run lint`, `npm run typecheck`, the full test suite and `npm run build:agent` pass.
- [x] The browser probe confirms the sort scroll, the selection reset and the URL round-trip against the agent database.
- [x] No screenshots, run logs or throwaway files are left behind.

## Comments

**2026-11-26 — landed in `6f75ed5b` (docs) and `c25028d2` (sort selector).**

- `docs/media.md` now describes the header as one control row with the bounded search on the right and the actions on the left, with Archived keeping only the search. It records that the relational-reference count and the "Used in" row are gone while the permanent-deletion guard stays and refuses a referenced Media without a number. The Recent box is the four-item preview with the second-row reveal and eight-item cap, no pagination and no "Show less". My Drive and Archived load eight-Media blocks through the shared "View more" control: spinner, toast and retry, end state, folders from the first block, selection surviving a block and cleared on a scope change, and no `page` in the URL. It documents the `sort` selector (Created, Name, Size; accessible name "Sort by"; URL parameter cleared at the default), the restart from the first block with the scroll and selection reset, and the `search`/`view`/`folderId`/`sort` URL contract. The map table names the sort selector and the shared search-param parser.
- The sort selector now uses the shared shadcn `Select` (`@/shared/ui/select`) instead of a native `<select>`, at its content width (`min-w-28`), keeping the accessible name "Sort by". The panel test opens the trigger, reads the option from the select's own portalled content (`aria-controls`) and asserts the change callback.
- Verification: `npm run lint` 0 errors (250 pre-existing warnings), `npm run typecheck` clean, full suite 308 files / 2798 tests passing, `npm run check:doc-citations` 97 docs / 0 broken, `npm run build:agent` passes (only the existing Turbopack warning about the `.media-storage` file pattern).
- Browser probe against `pictures_writers_agent` (temporary probe Media, removed afterwards): at `/admin/media/`, Created listed lima first, Name listed Alpha first, Size listed foxtrot first. Created → Name wrote `?sort=name`, scrolled the content pane from `1497` to `705` and cleared 1 checked card to 0; Size wrote `?sort=size`; returning to Created cleared the query string. A shared URL with `?search=Probe&folderId=probe-sort-folder&sort=name` opened with the search filled, the breadcrumb `My Drive / Probe Folder` and the selector on Name. A 1.5s wait was not enough for the folder-details read in dev; the same URL checked after 5s rendered the full breadcrumb.
- No screenshots, run logs or probe files remain; the temporary SQL and step files lived outside the repo and the probe rows and folder were deleted.
