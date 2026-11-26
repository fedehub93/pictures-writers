# Spec: Media library browsing — single control row, load-more and sorting

**Status:** ready-for-agent

## Problem Statement

The admin Media page spends vertical space on chrome instead of assets: the create/upload actions and the search sit on two stacked rows, and the search stretches across the whole content width. The library is read in fixed pages with Previous/Next controls, which makes browsing a large library a sequence of page jumps: every page replaces the grid, resets the selection and gives no sense of continuity. The Recent box compounds this by exposing its own local pagination and a "Show less" toggle for what is meant to be a short preview, so it reads like a second copy of My Drive.

The page also surfaces a relational-reference count in the panel header, in the details column and in the archive/delete dialogs. That number is misleading: it counts only relational references and misses the Media embedded inside TipTap JSON fields, so an editor cannot trust it. It adds copy and visual weight without answering the question it appears to answer.

Finally, the library has one fixed order — newest first. An editor who knows the file name or is looking for the largest asset cannot reorder the grid.

## Solution

Collapse the page header into one control row: New Folder and Upload Media on the left, a wide but bounded search on the right, wrapping on narrow screens. Replace page-by-page browsing in My Drive and Archived with a "View more" control under the grid that appends the next block of Media, keeping folders at the top of the list. Keep the Recent box as a preview but let one click reveal a second row, capped at two rows total, with no pagination and no collapse.

Add a sort selector to the My Drive and Archived panel headers: Created (default, newest first), Name (A to Z) and Size (largest first). The choice lives in the URL and applies to search results and to any open folder.

Remove every visible trace of the relational-reference count — the usage note, the "Used in" row and the reference wording in dialogs — while keeping the server-side guard that refuses to delete a Media still used by content.

## User Stories

1. As an editor, I want the create/upload actions and the search on one row, so that the page spends more of its height on assets.
2. As an editor, I want the search on the right at a wide but bounded width, so that it is easy to reach without dominating the row.
3. As an editor on a narrow screen, I want the search to wrap onto its own full-width row below the actions, so that neither control is cramped.
4. As a keyboard user, I want the controls to stay in a sensible tab order when the row wraps, so that navigation matches what I see.
5. As an editor, I want the Recent box to show the four newest active Media, so that I can see recent uploads at a glance.
6. As an editor, I want a centered "View more" button under the Recent box, so that I can reveal another row without leaving the page.
7. As an editor, I want one click on "View more" to reveal four more cards, so that the second row arrives together rather than one card at a time.
8. As an editor, I want the Recent box to stop at two rows, so that it remains a preview and does not become a second My Drive.
9. As an editor, I want the "View more" button to disappear once the two rows are shown, so that the box does not offer an action with no effect.
10. As an editor, I want no "Show less" toggle and no pagination in the Recent box, so that the preview stays simple.
11. As an editor, I want the Recent box hidden while searching and in Archived, so that it never competes with the list I am reading.
12. As an editor, I want Recent cards to keep their action menu but no checkbox or selection, so that the preview does not join bulk operations.
13. As an editor, I want a centered "View more" control under the My Drive grid, so that I can ask for the next block of Media deliberately.
14. As an editor, I want "View more" to append the next block instead of replacing the grid, so that I keep my place and my context.
15. As a keyboard user, I want to activate "View more" with Enter or Space, so that the feature does not depend on a mouse.
16. As an editor, I want a spinner while the next block loads, so that I know the request is in flight.
17. As an editor, I want a readable message and a retry when loading fails, so that a transient failure does not leave the list silently stuck.
18. As an editor, I want "View more" to disappear when the last block is loaded, so that I know the list is complete.
19. As an editor, I want folder cards to appear only at the top of the list and never repeat between blocks, so that the grid stays predictable.
20. As an editor, I want my card selection to survive loading another block, so that bulk actions are not interrupted by browsing.
21. As an editor, I want my selection cleared when I change search, view, folder or sort, so that I never act on items that are no longer part of what I am looking at.
22. As an editor, I want the Archived view to use the same load-more behaviour, so that the two views in the same panel feel the same.
23. As an editor, I want every block to hold eight Media, so that the first screen stays light and each request has a predictable cost.
24. As an editor, I want search, view, folder and sort to stay shareable in the URL, so that I can send a colleague the exact list I am looking at.
25. As an editor, I want an old link containing a page number to open the first block instead of failing, so that legacy bookmarks still work.
26. As an editor, I want changing a filter or the folder to start from the first block, so that I never land in the middle of a list I have not seen.
27. As an editor, I want a sort selector on the right of the My Drive header, so that reordering does not require leaving the grid.
28. As an editor, I want "Created" to be the default order with the newest first, so that the initial view is unchanged and predictable.
29. As an editor, I want to sort by name from A to Z, so that I can find a file whose name I know.
30. As an editor, I want to sort by size with the largest first, so that I can find heavy files for cleanup.
31. As an editor, I want Media without a known size to appear at the end of the size order, so that they never masquerade as the largest or the smallest.
32. As an editor, I want the same sort selector in Archived, so that the archived list can be inspected the same way.
33. As an editor, I want the sort selector both at the My Drive root and inside a folder, so that it works wherever I am.
34. As an editor, I want sorting to apply to search results, so that a name search can still be ordered by size or date.
35. As an editor, I want the URL to remember my sort, so that a refresh or a shared link keeps the order.
36. As an editor, I want the list to scroll back to the top when I change the sort, so that I do not stay midway through a result set I have not seen from the start.
37. As a screen reader user, I want the sort control announced as "Sort by", so that its purpose is clear without a visual label.
38. As an editor on a narrow screen, I want the sort control to wrap below the breadcrumb or title, so that the header does not squeeze the path.
39. As an editor, I want the relational-reference usage note gone from the panel header, so that the page carries less misleading copy.
40. As an editor, I want the "Used in" row and its tooltip gone from the details column, so that the panel shows only facts I can trust.
41. As an editor, I want the archive and delete dialogs to describe what happens without quoting reference counts, so that the confirmations stay short and honest.
42. As an editor, I want deletion to still be refused while content uses a Media, so that I cannot orphan an image that published content points at.
43. As an editor, I want that refusal to explain the situation without a number, so that the message cannot overstate what was counted.
44. As an editor, I want the details column to keep the size, dimensions, MIME, checksum, storage driver, URL and dates, so that removing usage does not remove useful facts.
45. As a maintainer, I want the list read to stop computing reference counts per row, so that the grid does not pay for a fact the UI no longer shows.
46. As a maintainer, I want the grid, the Recent box and the asset picker to keep sharing one list procedure, so that there is no second pagination contract to maintain.
47. As a maintainer, I want the first block server-prefetched, so that the panel does not flash empty while the client query resolves.
48. As a maintainer, I want the header's count read to ignore the sort, so that changing the order does not trigger an unnecessary refetch.
49. As a maintainer, I want the change to need no schema migration, so that it can land without an expand/contract step.
50. As a maintainer, I want the media documentation updated with the new row, load-more and sort behaviour, so that the next session inherits the truth.

## Implementation Decisions

- **No database change.** Sorting reads existing columns: `createdAt` on the Media row and `size` on the stored-file record. No migration and no backfill.

- **One list procedure, three optional sort orders.** The Media list procedure gains a `sort` input: `created` (default), `name`, `size`. Directions are fixed: newest first for Created, case-insensitive A to Z for Name, largest first for Size. Size is read through the stored-file relation, with unknown sizes last. Every order ends with a stable tie-breaker on the Media id so paging cannot repeat or skip a row. All three clients of the procedure — grid, Recent box, asset picker — keep receiving the same response shape.

- **Pagination stays in the API, leaves the URL.** The list procedure keeps `page` and `pageSize` because the asset picker and the Recent box still request a specific page. The admin library stops sending `page`; its loaded blocks are query state. The search-param contract loses `page` and gains `sort`, which is parsed with a default and cleared when it is the default. Old links carrying a page number are ignored rather than rejected.

- **Load-more, not infinite scroll.** My Drive and Archived load the next block only when the editor activates "View more". No viewport observer, no automatic fetch. The button is a real button, shows an inline spinner while the next block loads, reports a failure with a toast and returns to its enabled state, and is not rendered when no next block exists.

- **The library uses the picker's infinite-query pattern.** The list has no cursor, so the client composes the query key, query function, initial page and next-page rule by hand, exactly as the asset picker already does. The server prefetches the first block into the same infinite query key so the page hydrates with content and the existing suspense boundary resolves immediately. Folders come from the first block only; later blocks append Media only.

- **Block size stays eight Media.** No new page size is introduced for the library. The request cost and the number of thumbnails fetched on first paint stay as they are today.

- **Selection is scope-bound.** Checked ids survive loading another block, because the corresponding cards remain on screen. They are cleared whenever search, view, folder or sort changes, because the loaded set is replaced. The panel remount key includes the sort and excludes the page.

- **Recent is a two-row preview.** The box keeps a single read of eight Media and reveals four at a time, so the second row is instant and needs no request. A new reveal limit caps the box at eight items; the button appears only when more than four items exist and disappears once the cap is reached. "Show less", the local pagination and the expanded-list state are removed. The box remains hidden in Archived and while a search term is present.

- **No height animation.** Neither the Recent box nor the My Drive grid animates its height. The revealed cards simply appear; this avoids measuring a reflowing grid and keeps the change small.

- **One shared load-more control.** Both surfaces use the same presentational button, labelled "View more" with a downward chevron, centered under the relevant grid. Recent passes no loading state because its reveal is local; My Drive passes the fetching state and the click handler.

- **Sort control in the panel header.** The header becomes a two-ended row: breadcrumb (or the Archived title) on the left, sort select on the right. The select has no visible label and an accessible name of "Sort by"; it wraps below the title on narrow screens. Changing the sort updates the URL, restarts the list from the first block and scrolls the panel to its top. The page header count read does not receive the sort, so it is not refetched on reorder.

- **Reference information is removed from the UI, not from the guard.** The usage note under the panel header, the "Used in" row and its tooltip, the reference-based branches in the card archive/delete dialogs, and the per-row usage count in the list response all go. The panel header keeps only the bulk actions, rendered only when something is checked. The server guard that refuses permanent deletion of a referenced Media stays, including its test, but its message drops the count and the rich-text caveat: it states that the Media is still used by content and must be detached first. The reference counting service itself stays because the delete guard and the archive tests use it.

- **Details column keeps its other facts.** Size, dimensions, MIME, checksum, storage driver, public URL, created and updated remain. The folder view is unchanged.

- **Archived shares the behaviour.** The same panel renders both views, so load-more and the sort selector apply to both. The Archived header gets the title plus the sort control, with no breadcrumb.

- **Documentation moves with the feature.** The media map document is updated for the single control row, the removed usage copy, the two-row Recent box, the replacement of pagination with load-more in both views, and the new sort contract.

## Testing Decisions

A good test here asserts what an editor or an API client can observe: which rows come back and in what order, which controls are rendered, what a click changes on screen, and what is absent. It does not assert internal state names, query keys, hook identities or the shape of props beyond what a rendered surface needs.

Three seams, all but one pre-existing:

- **Media list procedure, against the disposable test database.** The existing router test suite is the seam for the list contract. Extend it with the sort orders: Created newest first, Name case-insensitive ascending, Size descending with unknown sizes last, and a stable order across page boundaries. Keep the existing assertions that search and folder scoping still work with the default sort, that the picker/Recent page contract is unchanged, and that a page size above the limit is rejected. Replace the test that asserted per-row reference counts with one asserting the list response no longer carries them. Prior art: the existing `getMany` tests in the media router suite.

- **Media library components in the happy-dom harness with mocked hooks.** Extend the existing component suites:
  - Recent box: four cards initially; "View more" only above four items; one activation reveals the second row; the box never exceeds eight items; the button disappears at the cap or when the list is short; no pagination text and no "Show less"; still hidden when searching or archived; the action menu still calls the move callback.
  - My Drive / Archived panel: "View more" rendered only when a next block exists, calls the load callback, shows the loading state and disappears when there is no next block; the sort select exposes the accessible name and reports the chosen order; the usage note is absent; the bulk action slot still appears only when something is checked; breadcrumb and Archived title unchanged.
  - Details panel: the "Used in" row is not rendered, while size, dimensions, MIME, checksum, driver, URL and dates still are; the folder variant is unchanged.
  - Card: the archive and delete dialogs no longer contain reference counts or the rich-text caveat, while edit, replace, move, archive, restore and permanent delete still behave.
  Prior art: the existing Recent box, library panel, details panel and card suites, which render with `createRoot` and stub their data hooks.

- **Media search-param loader, as a new small pure test.** Load a URL with no media parameters and assert the defaults include the Created sort and no page; load one with an explicit sort and assert it is parsed; load one with a legacy page number and assert the page is not part of the parsed contract. Prior art: none for this module; the test follows the existing pure-function tests in the repo rather than mounting the view.

Not automated: the scroll-to-top on sort change, the remount-driven selection reset and the URL round-trip through browser history. These are covered by a manual browser probe against the agent database, because mounting the whole Media view would require new mocks for suspense, URL state and the folder dialog provider with no prior art to copy.

## Out of Scope

- Automatic loading when the "View more" control enters the viewport. This version loads only on activation.
- Height or layout animation for either box.
- A "Show less" collapse in Recent, or any pagination inside it.
- Ascending/descending toggles, additional sort fields, or sorting folders.
- Sorting the Recent box or the asset picker; Recent stays newest-first by definition.
- Select-all, range selection or selection that follows the editor across sort changes.
- Drag and drop, a list layout, a lightbox.
- Making the reference count truthful by counting Media embedded in TipTap JSON, or changing which content relations the guard inspects. The count is hidden, not fixed.
- Any change to archive, restore, delete or move semantics beyond the wording of the deletion refusal.
- Deep links to a specific loaded block.

## Further Notes

- The two-row cap is what keeps Recent a preview: without it, repeated clicks would reproduce My Drive block by block.
- A legacy `?page=` parameter is left in the URL untouched but has no effect; the library opens its first block.
- Sorting by name should be case-insensitive so that a filename's casing does not split the alphabet; sorting by size must use the stored-file record, because the Media row no longer stores size.
- The header's count read intentionally ignores the sort. The grid's read includes it, so changing the order starts a new list from the first block while the count stays warm.
- Verification for the implementer: the repository's lint, typecheck, test suite, production agent build and documentation-citation check all pass, and the manual browser probe covers the sort scroll, the selection reset and the URL round-trip.
