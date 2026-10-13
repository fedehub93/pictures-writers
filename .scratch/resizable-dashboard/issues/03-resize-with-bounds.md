# 03: Resize with bounds and persistence

**What to build:** In edit mode a backoffice user resizes a widget by its corner, snapping to cells and staying between the widget's minimum and maximum bounds, and the new size is auto-saved.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] In edit mode a widget shows a resize handle at its corner; dragging it resizes the widget along the grid.
- [ ] Resizing snaps to cells and respects the definition's minimum and maximum placement; a widget can never be resized below its legibility floor or above its maximum.
- [ ] A widget with no explicit maximum can grow to the full grid width.
- [ ] The resized placement is persisted by the existing auto-save and survives a reload.
- [ ] Resizing does not distort neighbouring widgets; they compact around the changed span without leaving a vertical hole.
