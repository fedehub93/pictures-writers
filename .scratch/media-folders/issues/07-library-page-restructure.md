# 07: Library page restructure

**What to build:** The Media page reads as two boxed panels — a "Recent" strip over a "My Drive" panel — with the create/upload actions in a top bar, one menu per card instead of a row of buttons over the thumbnail, and the details column inside the My Drive panel rather than spanning the page.

**Blocked by:** none (01, 03, 05 and 06 are done)

**Status:** done

## Decisions

Settled in a grilling session on 2026-11-24; the reference screenshots are the author's, not in the repo.

**Page frame**

- The three-pane shell stays: folder sidebar on the left, content on the right. The sidebar goes from `w-56` to `w-64`.
- The heading is "Media" with no "N entry found" line. `ContentHeader`'s `totalEntries` becomes optional and the count paragraph renders only when a page passes it; every other page keeps its count.
- One control row under the heading: search at the far left (placeholder "Search by name"), then "New Folder" and "Upload Media" at the far right.
- The storage-driver select and its helper line leave the page entirely. The component stays in the repo for the future Settings session; the Media page no longer renders it. No replacement hint is added.
- The rehome banner stays, full width, directly under the control row.
- Below that, two stacked boxes: Recent, then My Drive.

**Recent box**

- Shown in My Drive only — at the root and inside any folder. Never in Archived, and hidden while the search term is not empty.
- Holds the four most recent active Media, newest first. No folder cards.
- Not drawn at all when the library has no active Media.
- "View all" appears only when more than four exist. It expands the box in place into the full recent list, 8 per page with its own local pagination, and becomes "Show less" to collapse. The expansion is UI state, not URL state: it resets on navigation and is not deep-linkable.
- Cards carry no checkbox and the card itself does nothing on click: no selection, no navigation. Only the `⋮` menu acts.
- The box has no details column.

**My Drive box**

- A bordered, rounded panel. Header title is "My Drive" at the root; inside a folder the header shows a clickable breadcrumb (My Drive / Parent / Folder) whose segments open that folder.
- No "Total N items" strip, no grid/list toggle, no sort control, no switch.
- A muted sub-line under the header carries `MEDIA_USAGE_NOTE` on the left, always visible, and the bulk actions (Move to folder, Archive, Delete) on the right whenever at least one card is checked.
- The details column lives inside this box, as its right-hand column: it describes the selected Media, otherwise the open folder, otherwise the text placeholder "Select an item to view more information". No illustration asset. Below `xl` it stacks under the grid.

**Cards**

- The card body is the name and the size. A folder card is its name and "N items". The Media-type badge is gone; the "Archived" badge shows only in the Archived view.
- Every button over the thumbnail is replaced by a checkbox at top-left and a single vertical `⋮` button at top-right, both always visible (subtle, translucent), both stopping propagation so they never move the selection.
- Menu for an active Media: Edit, Replace, Move to folder, then a separator and Archive. Menu for an archived Media: Restore, and Delete permanently as the destructive last item. Permanent delete is not reachable for an active Media.
- Folder cards keep no checkbox and no menu: folder writes stay in the tree. Clicking a folder card still opens it.
- Selecting a card still rings it, and the name is still a button and the keyboard path to selection.

**Archived**

- Same shell: no Recent box; the second box is titled "Archived", with no breadcrumb, no New Folder and no Upload (the last two are already hidden). Its cards show the Archived badge and Restore / Delete permanently in the menu; the bulk actions offer Delete only.

**Navigation**

- The sidebar's Recent nav item is removed. My Drive and Archived stay; the tree, the per-folder "New subfolder" action and the storage-details widget stay.
- The sidebar's root `+` button is removed: the header's "New Folder" is the one way to create a folder. It creates inside the open folder, or at the My Drive root while searching, since a search has no open folder.
- Clicking a breadcrumb segment navigates the way the tree does: back to page one, upload target follows.

**URL and legacy**

- `recent` stays in the server enum: the asset picker reads it, and the Recent box and its expanded list read it.
- An old `?view=recent` link lands on My Drive with the Recent box collapsed; it must not render an error or an empty page.

**Deferred**

- Moving the storage-driver select into Settings is a separate session. This ticket only removes it from the page.
- Sorting, a list layout, folder-card actions, folder bulk operations, drag and drop and a Media lightbox remain out of scope.

## Checklist

- [x] `ContentHeader` accepts a missing `totalEntries` and other pages still show their count; the Media page renders "Media" alone.
- [x] The top bar has the search at the start and "New Folder" then "Upload Media" at the end; no storage-driver select is rendered anywhere on the page.
- [x] "New Folder" opens the existing create-folder dialog targeting the open folder (root while searching) and is hidden in Archived; the tree keeps "New subfolder".
- [x] The Recent box shows the four newest active Media, is absent when there are none, hidden in Archived and hidden while searching, and its cards have no checkbox and no click action.
- [x] "View all" appears only above four items, expands the box in place with its own pagination, and "Show less" collapses it.
- [x] The Recent box card menu performs Edit, Replace, Move to folder and Archive on its Media.
- [x] The My Drive panel carries the title or breadcrumb, the usage note and the bulk actions line, and no count strip or display controls.
- [x] Breadcrumb segments navigate to the folder they name, and the tree highlight follows.
- [x] The details column renders inside the My Drive panel for a selected Media and for the open folder, with the text placeholder otherwise, and stacks under the grid below `xl`.
- [x] Media cards show name and size only, folder cards name and item count, no type badge, and the Archived badge only in the Archived view.
- [x] A card's thumbnail overlay is the checkbox and one `⋮` button; the menu holds Edit, Replace, Move to folder and Archive for active Media and Restore plus Delete permanently for archived Media.
- [x] Using the menu or the checkbox does not change the details selection.
- [x] The Archived view shows only the Archived panel, with bulk Delete and no create or upload control.
- [x] The sidebar is `w-64`, has no Recent item and no root `+`, and still shows the folder tree, "New subfolder" and storage details.
- [x] An old `?view=recent` URL opens My Drive with the Recent box collapsed.
- [x] Component tests are updated for the card, the details panel and the folder card, and added for the Recent box (count, search and Archived hiding, expansion) and the My Drive panel (title, breadcrumb, usage note and bulk actions slot).
- [x] `docs/media.md` describes the new layout and interaction, and `GLOSSARY.md` sharpens **Recent** so it names the preview surface and the picker read rather than a page view. "My Files" is not introduced as a term.
- [x] `npm run lint`, `npm run typecheck`, the test suite, `npm run build:agent` and `npm run check:doc-citations` pass.

## Notes

- The Recent box needs its own read. Prefetch it alongside the main list on the server so the box renders with the page instead of popping in, and invalidate it with the rest of the library after archive, restore, delete, move, replace and upload.
- The expansion's page state is separate from the URL's `page`, which belongs to the My Drive grid.
- The Recent box is the one place where a card is a container rather than a control; its hover treatment must not imply navigation.

## Comments

**2026-11-26 — implemented in `5857f342`** (`feat(media): restructure library page with Recent box and in-panel details`).

- `ContentHeader.totalEntries` is optional; the Media header shows "Media" alone.
- Header owns search, "New Folder" and "Upload Media"; the storage-driver select and helper line left the page. "New Folder" targets the open folder, or the root while searching, and is hidden in Archived. Folder create/rename moved to a shared `MediaFolderDialogProvider`.
- Sidebar is `w-64`, has no Recent item and no root `+`; it keeps the tree, "New subfolder" and storage details.
- Recent box: four-newest preview, hidden when empty/searching/Archived, "View all"/"Show less" with local eight-per-page pagination, cards without checkbox or click selection. Prefetched on the server and invalidated with the library through the existing `getMany` path filter.
- My Drive/Archived panel: title or breadcrumb, usage note, bulk actions (Move/Archive/Delete in My Drive; Delete in Archived) and the details column inside the panel, stacking below `xl`.
- Cards show name and size only; overlay is a checkbox plus one vertical `⋮` menu. Active menu offers Edit, Replace, Move to folder, Archive; archived menu offers Restore and Delete permanently. The type badge is gone, and the Archived badge appears only in Archived.
- Legacy `?view=recent` normalizes to My Drive with the Recent box collapsed; `recent` stays in the server enum for the picker and Recent box.
- `docs/media.md` and `GLOSSARY.md` (**Recent**) updated.

Verification: `npm run lint` (0 errors), `npm run typecheck` (clean), `npm run test:run` (306 files, 2773 tests passed), `npm run build:agent` (clean), `npm run check:doc-citations` (97 docs, 0 broken citations).
