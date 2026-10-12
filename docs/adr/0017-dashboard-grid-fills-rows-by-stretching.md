# The dashboard grid fills each row by stretching its last widget

**Status**: accepted.

Dashboard widgets carry a discrete width (`small`, `medium`, `full`) placed on a fixed six-column grid, but the widths do not tile: `small + medium` (`2 + 3`) leaves a column of the row empty, and arbitrary mixes of thirds and halves leave similar holes. The dashboard therefore **packs its widgets into rows in list order and, whenever a row does not add up to the full grid, stretches the last item of that row to close it** — including the trailing add tile, which tends to absorb the final row's remainder. Rows never show a horizontal hole, and no new dependency or layout engine is introduced.

We kept the domain model unchanged: the layout stays an ordered list of instances with an optional per-instance size, so drag reordering and auto-save (ADR-0016) continue to work, and changing a size never rewrites storage. The cost is that a widget's rendered width may exceed the tier it names when it lands last in a partial row; heights stay uniform across a row because the grid still stretches cells to their row's tallest.

**Considered options.** Making every item `flex-grow` would fill rows but distort all widths in a row, not just the last; `grid-auto-flow: dense` fills holes but reorders widgets visually, breaking the drag order; a full two-dimensional bento grid (explicit `x`/`y`/`w`/`h` with drag-resize) would give real freedom but needs a layout engine, a new dependency, and a change of domain from an ordered list to a positioned arrangement; and adding an `xs` tier would multiply the ragged combinations the fill rule exists to absorb, while a usefully narrow `xs` would require moving to a twelve-column grid.
