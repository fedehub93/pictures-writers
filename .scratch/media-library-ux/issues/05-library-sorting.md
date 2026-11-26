# 05: Sort the library by created, name or size

**What to build:** My Drive and Archived gain a sort selector at the right of their panel header. Created keeps the newest first and remains the default; Name orders A to Z ignoring case; Size orders largest first with Media of unknown size at the end. The choice lives in the URL, applies at the root, inside a folder and to search results, and survives a refresh or a shared link. Changing the order restarts the list from the first block, scrolls the panel back to its top and clears the selection.

**Blocked by:** 04 — Load more in My Drive and Archived

**Status:** done

## Decisions

- The list procedure gains a sort input with three values and fixed directions. Every order ends with a stable tie-break on the Media id so blocks cannot repeat or skip a row.
- Size is read from the stored-file record, because the Media row no longer stores it. Unknown sizes sort last in both directions.
- The sort is parsed from the URL with a default and cleared when it is the default, like the other media filters.
- The header read that counts the current scope does not receive the sort, so reordering does not refetch the count.
- The selector has no visible label and an accessible name of "Sort by". It sits on the right of the breadcrumb, and of the Archived title, and wraps below it on narrow screens.
- Changing the sort updates the URL, restarts the list from the first block, scrolls the panel to the top and clears the checked Media.
- Recent stays newest first regardless of the selector, and folder cards keep their current order.

## Checklist

- [x] My Drive shows the sort selector at the right of the breadcrumb at the root and inside a folder; Archived shows it at the right of its title.
- [x] The selector has no visible label and is announced as "Sort by"; it wraps below the title on narrow screens.
- [x] Created is the default and lists the newest first.
- [x] Name lists A to Z case-insensitively; Size lists largest first with unknown sizes last.
- [x] Both orders are stable across blocks, with the Media id as the final tie-break.
- [x] The sort is stored in the URL and cleared when it is the default; a refresh or a shared link keeps the order.
- [x] Changing the sort restarts from the first block, scrolls the panel to the top and clears the selection.
- [x] The header count does not refetch when only the sort changes.
- [x] Router tests cover the three orders, the unknown-size placement and the page stability; the search-param test covers the sort default and parsing; the panel test covers the accessible name and the change callback.
- [x] `npm run lint`, `npm run typecheck` and the test suite pass.

## Comments

**2026-11-26 — landed in `72ad2948`.**

- `media.getMany` gained a `sort` input (`created`, `name`, `size`; default `created`). Created and Size are Prisma `orderBy` chains, both ending on `id`; Size reads `storedFile.size` with `nulls: "last"`, so a Media with no record or no size is at the end. The header read (`getMeta`) does not take the input, so reordering never refetches the count.
- Name is paged in SQL because Prisma has no case-insensitive `orderBy` and production runs the `C` collation. The block is ordered by `name COLLATE "und-x-icu" ASC, id ASC`: case no longer splits the alphabet and accented names sort beside their base letter. The same conditions as `buildMediaWhere` are bound into the query (term, archived state, folder), and the id block is restored to that order from the typed read, so paging cannot repeat or skip a row.
- Tests caught a count/rows mismatch the first implementation had: Prisma's `contains` does not escape `%` or `_`, so the SQL predicate now uses the same `ILIKE` shape, and a router test pins `total` to the returned row for a wildcard term. Additional coverage: name order case-insensitively, size order with unknown last, name and size across page boundaries, and the order inside a folder and across a search.
- The URL contract gained `sort` with `clearOnDefault`, so a shared `?sort=name` opens in name order and returning to Created drops the parameter. The Recent box and the asset picker send no sort and stay newest-first.
- `MediaSortSelect` is a native `select` with `aria-label="Sort by"` and no visible label, placed with the breadcrumb/Archived title in a `flex-wrap` row. The panel takes `sort` and `onSortChange`; the view applies the change in an effect after the panel remounts, because scrolling during the handler landed above the panel. The scope key now includes the sort, and a stale selection entry is dropped when the scope changes, so switching Created → Name → Created does not resurrect the old checks. The Recent box keeps its reveal across a reorder but still resets on search/view/folder change.
- `docs/media.md` is deliberately left for ticket 06, whose decision is one documentation pass at the end. No schema, routing or Prisma change, so the agent build is ticket 06's end-to-end run.

Verification: `npm run lint` 0 errors (250 pre-existing warnings), `npm run typecheck` passes, full suite 308 files / 2798 tests passing. Browser probe against the agent database (`?sort=name` shared link, then reorder round-trip): shared link opens with the selector on Name; Created → Size writes `?sort=size`, scrolls the content pane from `1263` to `705` so the panel sits under the header, clears 1 checked card to 0, and shows the largest row first; Created → Name → Created leaves 0 checked (no resurrection) and returning to Created clears the query string. The narrow-screen wrap is structural (`flex-wrap`) and was not viewport-probed.
