# 02: Upload into the selected folder

**What to build:** An editor can upload a file and it lands inside the folder currently open in the library; if no folder is open, it lands at the My Drive root.

**Blocked by:** 01 — Folder tree sidebar

**Status:** done

- [x] `POST /api/media` accepts an optional `folderId` field.
- [x] The upload route assigns the provided `folderId` to the created `Media`.
- [x] `CreateMediaModal` receives the currently selected folder id from the library.
- [x] When the current view is "Recent" or "Archived", uploads land at the My Drive root.
- [x] Route tests cover upload with folder target, without folder target, and fallback to root.

## Comments

**2026-11-24 — landed in fabb7c60.**

`POST /api/media` reads `folderId` from the multipart body and hands it to
`createMediaFromUpload`, which files the new row into that folder on both the
image and the plain-file path. The folder is checked before any row is written,
so a deleted folder answers `404 MEDIA_FOLDER_NOT_FOUND` instead of an uploaded
file filed nowhere; the same 404 maps the narrow race where the folder is
deleted between the check and the insert (Prisma `P2003`, via the new
`isForeignKeyConstraintError` in `src/shared/lib/prisma-errors.ts`). A form
value that is not a string is ignored rather than coerced into a bogus id.

The library already carries a `folderId` query-state key
(`useMediaFilters`), which is the selection seam: `MediaCreateAction` passes the
folder into the modal store, the modal posts it, and the picker passes nothing,
so picker uploads stay at the root. `mediaUploadFolderId` in
`src/modules/media/lib/media-folder.ts` is the single rule for flat views: only
My Drive files into a folder, so Archived — and Recent, once ticket 03 adds it —
start at the root. The rule is unit tested. Nothing selects a folder yet:
ticket 03 owns clicking the tree and the folder-scoped grid, and until it lands
the target can only be set through `?folderId=`. The upload action remains
hidden in Archived, as before, because a new upload is active Media that the
archived view could not show.

No browser probe ran. Verification: `npm run typecheck` clean; `npx eslint`
clean on every changed file; `npm run check:doc-citations` 0 broken citations;
`npm run test:run` 299 files / 2717 tests passed; `npm run build:agent`
succeeded against `pictures_writers_agent`. New coverage is 3 pure tests for the
upload-target rule and 5 route tests (image and document into a folder, no
folder, folder gone before the upload, folder deleted during the upload).
