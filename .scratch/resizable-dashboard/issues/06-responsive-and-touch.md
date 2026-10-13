# 06: Responsive collapse and touch behaviour

**What to build:** On a narrow screen the dashboard becomes a single readable column, and on a touch device resizing is unavailable while reordering still works in edit mode.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Below the `md` breakpoint the arrangement collapses to a single column ordered by row then column, with no horizontal scroll.
- [ ] The desktop arrangement is not modified by the collapse; returning to a wide viewport shows the saved arrangement.
- [ ] On a coarse pointer (touch) resize handles are unavailable and resizing cannot be triggered.
- [ ] Reordering by drag remains available on touch in edit mode.
- [ ] The `+` library flow and the keyboard layout control still work at the single-column width.
