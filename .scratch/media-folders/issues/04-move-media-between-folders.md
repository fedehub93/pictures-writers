# 04: Move Media between folders

**What to build:** An editor can move one or more Media into another folder via a context menu or bulk action.

**Blocked by:** 01 — Folder tree sidebar, 03 — Folder-scoped grid and Recent view

**Status:** done

- [x] tRPC mutation `moveMedia` supports moving one or many Media to a target folder.
- [x] Moving Media to a non-existent or invalid folder is rejected.
- [x] A "Move to folder" action is available in the card context menu.
- [x] A "Move to folder" action is available in the bulk selection toolbar.
- [x] The grid refreshes and reflects the new location after a move.
- [x] Router tests cover single and bulk moves and validation.
- [x] Component tests cover the move action UI.

## Comments

**2026-11-24 — landed in 8143cf62.**

`media.moveMedia` takes one or many ids and a target `folderId`; null is the My
Drive root, so unfiling uses the same action. `moveMediaToFolder` in
`src/modules/media/server/media-service.ts` checks the folder before writing,
then loads every id, so a deleted folder or an unknown Media refuses the whole
batch instead of filing part of it — the same rule archive and restore already
use. The folder pre-check gives a readable `NOT_FOUND`; the narrow race where
the folder disappears between check and write is translated to the same
`MediaFolderNotFoundError` through `mediaFolderRaceError` (the former
`mediaCreateError`, renamed because move now shares it). Archived Media are not
refused, because they keep their `folderId` and the target describes filing
rather than visibility; the UI simply does not offer the action on an archived
card.

The card's "More actions" menu and the bulk toolbar open the same
`MediaMoveDialog`, whose folder list is the already-cached tree drawn indented
with My Drive preselected. `mediaFolderName` joins `buildFolderTree` in
`lib/media-folder.ts` so naming the chosen target is a tree read, not a second
traversal. A move runs through `runBulkAction`, which now clears only the ids it
consumed and reports success, so moving one card leaves an unrelated selection
alone and a refused target keeps the picker open for another choice. Every move
invalidates `getMany` and `getMeta`, so the row leaves the open folder and the
folder card counts follow. `GLOSSARY.md` defines **Move to folder** and keeps it
distinct from **Re-home**, which moves bytes between drivers.

Verification: `npm run typecheck` clean; `npx eslint src/modules/media` 0 errors
(the repository's pre-existing warnings only); `npm run test:run` 302 files /
2741 tests passed; `npm run build:agent` succeeded against
`pictures_writers_agent`; `npm run check:doc-citations` 0 broken citations. New
coverage is 6 router tests (single, bulk, unfiling, unknown folder, unknown id
in a batch, batch untouched on refusal), 2 pure tree-name tests, 3 dialog tests
(the list, picking a folder, the root default) and 1 happy-dom card test (the
menu item calls `onMove` with the card id).

Browser probe in the agent environment against three seeded FILE Media and two
folders: the card's "More actions" menu opened the picker, "Probe Target" was
chosen and the confirm button named it, the dialog closed, the row left the My
Drive grid and the "Moved 1 Media" toast appeared; ticking the remaining card
and using the toolbar's "Move to folder" filed it into "Probe Child" with the
same confirmation. Both `folderId` values were in the database afterwards, no
dialog remained and the probe reported no page errors. The seeded probe rows were
deleted after the run.
