# 04: Move Media between folders

**What to build:** An editor can move one or more Media into another folder via a context menu or bulk action.

**Blocked by:** 01 — Folder tree sidebar, 03 — Folder-scoped grid and Recent view

**Status:** ready-for-agent

- [ ] tRPC mutation `moveMedia` supports moving one or many Media to a target folder.
- [ ] Moving Media to a non-existent or invalid folder is rejected.
- [ ] A "Move to folder" action is available in the card context menu.
- [ ] A "Move to folder" action is available in the bulk selection toolbar.
- [ ] The grid refreshes and reflects the new location after a move.
- [ ] Router tests cover single and bulk moves and validation.
- [ ] Component tests cover the move action UI.
