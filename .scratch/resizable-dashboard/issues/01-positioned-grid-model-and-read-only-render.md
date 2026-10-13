# 01: Positioned grid model and read-only grid render

**What to build:** The dashboard renders its Dashboard widgets on the new positioned two-dimensional grid instead of the discrete-size, row-packed grid. Each widget has a grid placement rather than a size, widgets compact upward, and below the `md` breakpoint the arrangement collapses to a single column. For now the grid is read-only — moving and resizing arrive in later tickets — but a saved layout (or a brand-new empty one) renders correctly on the new model.

**Blocked by:** None (can start immediately)

**Status:** ready-for-human

- [x] A Dashboard widget instance carries a placement (column, row, width, height) instead of a discrete size; the persistence schema and the per-user JSON type are updated to match.
- [x] A Widget definition keeps its `small`/`medium`/`full` size preset, which resolves to a seed placement and its legibility bounds; a definition may override its minimum/maximum placement.
- [x] The pure layout model resolves a definition's preset and bounds, applies a placement update by instance key, and computes the first free slot for an instance of a given span; these are unit-tested.
- [x] The read-time layout function filters saved instances to existing, permitted definitions only, preserving their placement; the legacy hidden branch is gone and its handling removed from the tests.
- [x] The dashboard renders the positioned layout read-only on a twelve-column grid with vertical compaction; a moved widget never leaves a vertical hole.
- [x] Below the `md` breakpoint the grid becomes a single column ordered by row then column.
- [x] `dashboard.saveLayout` round-trips a placement alongside title and config for the current user only and still requires `dashboard.read`.
- [x] The registry test asserts every definition declares a valid size preset and resolves valid bounds.
