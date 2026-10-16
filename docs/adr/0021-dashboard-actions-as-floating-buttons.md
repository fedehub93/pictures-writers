# The dashboard's add and edit actions are floating buttons

**Status**: accepted. Refines [ADR-0019](./0019-dashboard-explicit-edit-mode.md).

ADR-0019 placed the edit toggle as a visible button in the dashboard header and kept adding behind a persistent bottom-right `+`. The header toggle scrolls away, so leaving edit mode from a widget near the bottom means scrolling back up. A bottom-right `+` alone solved reachability but sat over the last widget's corner.

The two global actions therefore become a small **stack of floating buttons fixed to the bottom-right** — *Modifica* / *Fine* above as the secondary mode toggle, *Aggiungi* below as the single primary action, keeping the accent on the creation anchor the old `+` carried — and the dashboard reserves bottom padding equal to their height so the last widget scrolls clear of them. Both actions stay within thumb reach at any scroll position, the header keeps its compact shape (title and the save indicator only, no mode toggle), and no card is ever covered.

Edit mode is unchanged: it is still explicit, still auto-saved, and the per-card non-spatial controls (rename, config) still work in both modes. A controlled `open`/`onOpenChange` on the Widget library lets the *Aggiungi* button open it; the library's own trigger remains optional for the empty-state prompt.

**Considered options.** A sticky header was tried and rejected: it spends permanent vertical space on a title and controls. Putting both actions in a header menu was tried and rejected: compact, but the header still scrolls away, so it fixes overlap without fixing reachability. A single FAB speed-dial was rejected as an extra tap per action. A pill that appears only once the header scrolls out was rejected as more machinery than the fixed pair needs.
