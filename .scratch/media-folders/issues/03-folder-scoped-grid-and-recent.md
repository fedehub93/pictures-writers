# 03: Folder-scoped grid and Recent view

**What to build:** An editor can open a folder from the tree or from the grid, see both subfolders and Media inside it, and switch to a "Recent" flat view.

**Blocked by:** 01 — Folder tree sidebar

**Status:** ready-for-agent

- [ ] `media.getMany` accepts an optional `folderId` and a `recent` view.
- [ ] `media.getMeta` returns totals for the current folder or Recent scope.
- [ ] The grid renders folder cards alongside Media cards for the current scope.
- [ ] Clicking a folder card navigates into that folder.
- [ ] The "Recent" sidebar item lists the latest active Media, ignoring folder membership.
- [ ] Router tests cover filtering by folder and the Recent view.
- [ ] Component tests cover folder card rendering and navigation.
