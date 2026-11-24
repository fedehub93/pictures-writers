# 02: Upload into the selected folder

**What to build:** An editor can upload a file and it lands inside the folder currently open in the library; if no folder is open, it lands at the My Drive root.

**Blocked by:** 01 — Folder tree sidebar

**Status:** ready-for-agent

- [ ] `POST /api/media` accepts an optional `folderId` field.
- [ ] The upload route assigns the provided `folderId` to the created `Media`.
- [ ] `CreateMediaModal` receives the currently selected folder id from the library.
- [ ] When the current view is "Recent" or "Archived", uploads land at the My Drive root.
- [ ] Route tests cover upload with folder target, without folder target, and fallback to root.
