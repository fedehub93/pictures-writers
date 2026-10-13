# 04: Add and remove widgets in the new model

**What to build:** A persistent `+` control in the corner opens the permission-filtered Widget library and adds the chosen widget into the first free slot, highlighting it; in edit mode a widget can be removed and later re-added.

**Blocked by:** 02

**Status:** ready-for-agent

- [ ] A persistent, bottom-right `+` control opens the permission-filtered Widget library and is available in both read and edit mode.
- [ ] Choosing a widget places it in the first free slot for its span and briefly highlights it so the user can find where it landed.
- [ ] The trailing `+` grid tile is retired; the empty-dashboard prompt still opens the library.
- [ ] In edit mode a widget can be removed with its control, and re-added later from the library.
- [ ] Adding and removing are auto-saved and survive a reload.
- [ ] The library only offers definitions the user is permitted to read, and only offers the Trend widget when the user can read at least one Metric.
