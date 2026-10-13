# The dashboard is always arrangeable, and layout changes are auto-saved

**Status**: superseded by [ADR-0019](./0019-dashboard-explicit-edit-mode.md).

The admin dashboard has **no edit mode**: every card's arrange controls (size, config, remove, drag) are always mounted — revealed on hover or focus on pointer devices, kept visible on touch — and widget bodies stay interactive, since dragging is confined to the drag handle. Each change (add, remove, reorder, resize, reconfigure) is persisted automatically with a short debounce and a subtle "Saving…/Saved" indicator; there is no Save/Cancel.

The alternative — an Edit/Done toggle with an explicit commit — was rejected because it turns the dashboard into a place you enter to edit and then leave, hides the arrangement affordances behind a mode switch, and spends header space on a save/cancel pair that only matters in the rare case of accidental change. Every change here is already reversible: a removed widget is re-added from the library, a resize or reorder can be redone, and a metric can be reconfigured. The cost is that a change persists the moment it is made; the gain is that what the user sees is what is saved, with no unsaved-change state to reason about.
