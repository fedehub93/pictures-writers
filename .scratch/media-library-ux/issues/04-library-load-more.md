# 04: Load more in My Drive and Archived

**What to build:** My Drive and Archived stop replacing the grid page by page. A centered "View more" control under the grid appends the next block of eight Media, keeping the rows already on screen. The control shows an inline spinner while loading, reports a failure and returns clickable for a retry, and disappears when the last block is loaded. Folders stay at the top of the list, never repeat between blocks, and the first block arrives with the page instead of after it.

**Blocked by:** 03 — Recent box as a two-row preview (for the shared "View more" control, not for the behaviour)

**Status:** done

## Decisions

- Loading happens only on activation. No viewport observer and no automatic fetch in this version.
- The library's read becomes an infinite query in the picker's pattern: the list has no cursor, so the key, query function, initial page and next-page rule are composed by hand. The first block is prefetched server-side into the same infinite key so the suspense boundary resolves with data and no empty grid flashes.
- The page number leaves the media URL contract; loaded blocks are query state. The list procedure still accepts a page because the asset picker and the Recent box request a specific page.
- Old links carrying a page number are ignored, not rejected; they open the first block.
- Changing search, view or folder starts again from the first block. Loading another block does not reset anything.
- Checked Media survive loading another block, since their cards stay on screen. They are cleared when search, view or folder changes. The panel's remount key follows the scope and no longer includes a page.
- Folders come from the first block only; later blocks append Media only.
- Archived uses the same read and control, because both views share the panel.

## Checklist

- [x] My Drive appends the next block of eight Media on each activation, keeping the rows already shown.
- [x] Archived has the same load-more behaviour.
- [x] The control renders only when a next block exists, shows an inline spinner while fetching, returns enabled with a readable message after a failure, and disappears at the end.
- [x] Folder cards render only in the first block and never repeat.
- [x] The media URL no longer carries a page; `search`, `view` and `folderId` are unchanged, and a legacy page parameter is ignored.
- [x] The first block is prefetched into the same infinite query key, so the page hydrates with content.
- [x] The asset picker and the Recent box keep working against the page-based list contract.
- [x] Selection survives loading another block and is cleared when search, view or folder changes.
- [x] The panel remount key follows search, view and folder, and no longer includes a page.
- [x] Component tests cover the control's presence, callback, loading and end states; a search-param test covers the removed page and the kept parameters.
- [x] `npm run lint`, `npm run typecheck` and the test suite pass.

## Comments

**2026-11-26 — landed in `08693039`.**

- My Drive and Archived now read the library as an infinite query. The first block of eight is prefetched server-side into the same key, and "View more" appends the next block through `useSuspenseMedia`. Folders come from `pages[0]`; rows come from every loaded page.
- The control (`MediaViewMore`) renders only while `hasNextPage`, shows its spinner from `isFetchingNextPage`, and disappears once `getNextPageParam` reports no next block. A failed fetch toasts and leaves the button enabled for a retry; the view calls `fetchNextPage({ throwOnError: true })` because the observer otherwise swallows the rejection.
- Checked ids are scope-stamped: they survive an appended block and read as empty when search, view or folder changes, without waiting for an effect. The panel remount key follows the same tuple and no longer includes a page.
- The URL contract lost `page` in one parser map (`lib/media-search-params.ts`) shared by the server loader and `useMediaFilters`, so the two cannot drift. A legacy `?page=` is not read; `search`, `view` and `folderId` are unchanged.
- The asset picker and the Recent box still request explicit pages. One `nextMediaPage` rule now drives the picker, the library and the prefetch.
- Tests: `params.test.ts` covers the defaults, the kept parameters, and a legacy page alongside them; the panel suite covers the control's presence, callback, loading state and end state.
- `docs/media.md` is deliberately left for ticket 06, whose decision is one documentation pass at the end so the page description is not edited in five conflicting places.

Verification: `npm run lint` 0 errors (250 pre-existing warnings), `npm run typecheck` passes, full suite 308 files / 2790 tests passing, `npm run check:doc-citations` 97 docs / 0 broken, `npm run build:agent` passes.
