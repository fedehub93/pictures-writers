# 05: Sort the library by created, name or size

**What to build:** My Drive and Archived gain a sort selector at the right of their panel header. Created keeps the newest first and remains the default; Name orders A to Z ignoring case; Size orders largest first with Media of unknown size at the end. The choice lives in the URL, applies at the root, inside a folder and to search results, and survives a refresh or a shared link. Changing the order restarts the list from the first block, scrolls the panel back to its top and clears the selection.

**Blocked by:** 04 — Load more in My Drive and Archived

**Status:** ready-for-agent

## Decisions

- The list procedure gains a sort input with three values and fixed directions. Every order ends with a stable tie-break on the Media id so blocks cannot repeat or skip a row.
- Size is read from the stored-file record, because the Media row no longer stores it. Unknown sizes sort last in both directions.
- The sort is parsed from the URL with a default and cleared when it is the default, like the other media filters.
- The header read that counts the current scope does not receive the sort, so reordering does not refetch the count.
- The selector has no visible label and an accessible name of "Sort by". It sits on the right of the breadcrumb, and of the Archived title, and wraps below it on narrow screens.
- Changing the sort updates the URL, restarts the list from the first block, scrolls the panel to the top and clears the checked Media.
- Recent stays newest first regardless of the selector, and folder cards keep their current order.

## Checklist

- [ ] My Drive shows the sort selector at the right of the breadcrumb at the root and inside a folder; Archived shows it at the right of its title.
- [ ] The selector has no visible label and is announced as "Sort by"; it wraps below the title on narrow screens.
- [ ] Created is the default and lists the newest first.
- [ ] Name lists A to Z case-insensitively; Size lists largest first with unknown sizes last.
- [ ] Both orders are stable across blocks, with the Media id as the final tie-break.
- [ ] The sort is stored in the URL and cleared when it is the default; a refresh or a shared link keeps the order.
- [ ] Changing the sort restarts from the first block, scrolls the panel to the top and clears the selection.
- [ ] The header count does not refetch when only the sort changes.
- [ ] Router tests cover the three orders, the unknown-size placement and the page stability; the search-param test covers the sort default and parsing; the panel test covers the accessible name and the change callback.
- [ ] `npm run lint`, `npm run typecheck` and the test suite pass.
