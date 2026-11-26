# 03: Folder-scoped grid and Recent view

**What to build:** An editor can open a folder from the tree or from the grid, see both subfolders and Media inside it, and switch to a "Recent" flat view.

**Blocked by:** 01 — Folder tree sidebar

**Status:** done

- [x] `media.getMany` accepts an optional `folderId` and a `recent` view.
- [x] `media.getMeta` returns totals for the current folder or Recent scope.
- [x] The grid renders folder cards alongside Media cards for the current scope.
- [x] Clicking a folder card navigates into that folder.
- [x] The "Recent" sidebar item lists the latest active Media, ignoring folder membership.
- [x] Router tests cover filtering by folder and the Recent view.
- [x] Component tests cover folder card rendering and navigation.

## Comments

**2026-11-24 — landed in 0d48cab2.**

My Drive now browses one level of the tree. `getMany` takes the open `folderId`
(absent or null is the root) and returns the child folders alongside the first
page of Media, each with its active item count; `getMeta` counts the same scope,
so the header cannot disagree with the grid. Folder cards are returned only for
the active view, the first page and no search term: they are where browsing
starts, not rows that repeat above every page of a folder's Media. `Recent` joins
the view enum as the flat newest-first read over all active Media. Archived stays
flat too, so an archived Media that kept its `folderId` never shows inside a
folder.

A search spans the whole active library and drops the folder filter. A name is
often the only thing the editor remembers, and searching the open folder alone
would hide a copy filed elsewhere. The "search only this folder" half of spec
story 13 is not implemented: no ticket owns it, so this ticket keeps the
pre-existing library-wide result set rather than silently narrowing it.
`openMediaFolderId` in `src/modules/media/lib/media-folder.ts` is now the one rule
for the open folder (upload target, sidebar highlight); it replaces
`mediaUploadFolderId`.

The picker reads `recent` instead of `active`, because My Drive is no longer a
flat "all active Media" read; the tiles and their order are unchanged. The
sidebar owns navigation: My Drive is selectable, Recent and Archived are new nav
items, and the tree highlights the open folder. The header's Library/Archived
switch is deleted as a duplicate of that nav. Folder writes invalidate the tree
and the grid together, so create, rename and delete refresh the cards, and
deleting the folder the grid is showing returns to My Drive. A folder opened from
a card does not auto-expand its tree branch; the highlight shows once the branch
is open (the details panel in ticket 05 owns the selected-item surface).

Verification: `npm run typecheck` clean; `npx eslint src/modules/media` 0 errors
(the repository's pre-existing warnings only); `npm run test:run` 300 files / 2731
tests passed; `npm run build:agent` succeeded against `pictures_writers_agent`;
`npm run check:doc-citations` 0 broken citations. New coverage is 9 router tests
(folder filter, root, library-wide search, Recent order, Archived across folders,
child folders and active counts, first-page-only cards, no cards during search,
`getMeta` scope) and 5 happy-dom tests (folder card name/count/singular/open, tree
row selection and the selected marker). `GLOSSARY.md` defines **Recent** and
`docs/media.md` describes the scoping and search rule.

Browser probe in the agent environment, against seeded folders and FILE Media:
clicking a folder card wrote `?folderId=probe-folder-1` and marked the tree row
as the current location; expanding a branch survived Recent → My Drive; opening
the parent from the grid showed the child folder card, and clicking it wrote
`?folderId=probe-folder-child`; Recent wrote `?view=recent` and My Drive cleared
the query; searching `Probe Search` at the My Drive root listed the filed and the
unfiled Media and no folder cards; deleting the open folder through its action
menu returned to `/admin/media/`, removed the card and the tree row, with no page
errors.
