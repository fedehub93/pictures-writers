# 02: Explicit edit mode with drag-to-move

**What to build:** A backoffice user enters an explicit edit mode from a single low-key control in the dashboard header, sees the grid, and drags widgets to new cells; leaving the mode returns the dashboard to a clean read surface. Moves are auto-saved. Renaming a widget and opening its config stay available outside edit mode.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A ghost Modifica/Fine control in the dashboard header toggles edit mode; it shows a pencil glyph and turns primary as "Fine" while editing.
- [ ] Outside edit mode the dashboard has no spatial controls and no visible grid; widget bodies stay fully interactive.
- [ ] Inside edit mode the grid is visible and widgets can be dragged to new cells; movement snaps to cells and compacts upward.
- [ ] A move is persisted with the existing auto-save debounce and the saving/saved indicator; there is no Save/Cancel.
- [ ] Renaming a widget's title and opening its config gear work in both modes.
- [ ] Reloading the page shows the arrangement the user last moved.
