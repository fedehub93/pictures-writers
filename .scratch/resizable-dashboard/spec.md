# Resizable Dashboard Grid

## Problem Statement

The admin dashboard arranges its Dashboard widgets on a fixed six-column grid, each widget carrying one of three discrete widths (`small`, `medium`, `full`). The tiers do not tile: arbitrary mixes of halves and thirds leave holes, and ADR-0017 patched those holes by stretching the last widget of a partial row, so a widget's rendered width can differ from the tier it names. The model cannot solve the two things users actually need. A per-column minimum width — the obvious way to keep a `small` widget legible on a narrow main column — propagates its min-content up through the grid and pushes the whole main column into horizontal scroll; without it, a `small` widget becomes unreadable when the sidebar eats the width. There is also no way to give a widget more *height*, or to place two widgets side by side and one below without the row packer deciding for the user. The ceiling is the one-dimensional, discrete-size model itself.

## Solution

The dashboard's layout becomes a **positioned two-dimensional grid**: each Dashboard widget holds a placement (column, row, width, height) on a twelve-column grid and can be dragged to move and resized by its corner, snapping to cells, bounded by a per-widget minimum and maximum. Vertical compaction removes holes as widgets move. The discrete sizes survive as **size presets** — the shape a new widget is seeded with and the step a keyboard resize moves by — not as the widget's identity. Arranging now happens behind an **explicit edit mode**: outside it the dashboard is a clean, interactive read surface; inside it the grid becomes visible and the move, resize, and remove controls appear, with rename and config remaining always available. A persistent `+` control opens the Widget library and drops the chosen widget into the first free slot. Below the `md` breakpoint the grid collapses to a single column and resize is unavailable on touch. Layouts are still saved per user and auto-saved; the stored shape changes from an ordered list of sized instances to a positioned arrangement, with no migration because the feature has never shipped.

## User Stories

1. As a backoffice user, I want to drag a widget to another cell on the dashboard, so that I can arrange the widgets by my priorities rather than the order I happened to add them.
2. As a backoffice user, I want to resize a widget by its corner, so that I can give more room to what matters and keep what does not out of the way.
3. As a backoffice user, I want the widget to snap to the grid as I move or resize it, so that the dashboard stays tidy instead of holding arbitrary pixel positions.
4. As a backoffice user, I want widgets to always be large enough to read and no larger than useful, so that resizing never makes a widget illegible or absurdly wide.
5. As a backoffice user, I want widgets to compact upward as I move them, so that I never have to clean up empty gaps below the ones I moved.
6. As a backoffice user, I want an explicit edit mode, so that the dashboard I read all day is not covered in drag and resize controls.
7. As a backoffice user, I want to enter and leave edit mode from a single, low-key control in the header, so that arranging is available without a mode switch dominating the page.
8. As a backoffice user, I want each change to be saved automatically, so that I never have to commit my arrangement explicitly.
9. As a backoffice user, I want rename and config to stay available outside edit mode, so that I can retitle a widget or change its filter without entering arrangement.
10. As a backoffice user, I want a `+` control always available in the corner, so that I can add a widget at any time from the permission-filtered library.
11. As a backoffice user, I want a newly added widget to land in the first free slot and be highlighted, so that I can find where it went.
12. As a backoffice user, I want to remove a widget from the dashboard in edit mode, so that I can drop what I no longer need.
13. As a backoffice user, I want the dashboard to become a single column on a narrow screen, so that widgets stay readable on a tablet or a split window.
14. As a backoffice user, I want to resize widgets when I have a pointer but not have to fight imprecise touch resizing, so that the touch experience stays calm.
15. As a keyboard user, I want to change a widget's size without a pointer, so that arranging is not mouse-only.
16. As a screen-reader user, I want layout changes to be announced, so that I know when a widget moved or resized.
17. As a developer, I want a single pure layout model (placement in, placement out) that the UI, the server filter, and the tests share, so that the grid has one source of truth.
18. As a developer, I want a Widget definition to declare its size preset and its legibility bounds, so that adding a widget never requires touching the grid.
19. As a developer, I want the stored layout to remain one per-user JSON document, so that the registry catalog and per-user storage from ADR-0015 are untouched.

## Implementation Decisions

### Vocabulary

- A **Dashboard widget** instance now carries a **placement** — its column, row, width, and height on the grid — instead of an ordered position and a discrete size.
- **Widget size preset** (`small`, `medium`, `full`) is the seed a Widget definition gives a new instance and the step a keyboard resize moves by; it is recorded in `CONTEXT.md`.
- The **Dashboard layout** is the positioned arrangement of a user's Dashboard widgets, filtered to the permitted definitions; it is redefined in `CONTEXT.md` from "ordered set" to "positioned arrangement".

### Grid model

- The layout is a **positioned two-dimensional grid** of twelve columns from `md` up, collapsing to one column below `md`.
- Rendering uses **`react-grid-layout`** in **controlled mode**: the layout array is the single source of truth, and the grid reports change events back rather than owning state.
- Movement and resizing **snap to cells**; the grid is not a continuous freeform canvas.
- **Vertical compaction** is on: widgets float up and no vertical hole remains; horizontal holes within a row are allowed.
- Each placement is bounded by **`minW`/`minH`** and optional **`maxW`/`maxH`**; the bounds come from the Widget definition (code), never the stored instance, so a definition can evolve its legibility floor without touching saved data.
- A Widget definition keeps a **`defaultSize` preset** that resolves (via a shared preset table) to a seed placement and its bounds, plus optional per-definition **`minGrid`/`maxGrid` overrides** for a widget that needs more room than the preset floor allows. This mirrors ADR-0015's optional `config`/`defaultConfig` pattern.

### Stored shape

- A Dashboard widget instance becomes `{ key, definitionId, title?, config?, grid: { x, y, w, h } }`; the `size` field is removed.
- The array order is no longer the model: a widget's position is its placement. Storage order is kept only as a stable tiebreak.
- Persistence stays a per-user JSON document in `DashboardLayout.widgets` (ADR-0015 unchanged); the persistence schema and the `PrismaJson.DashboardWidgets` type are updated accordingly.
- **No migration**: the feature has never shipped. The read-time layout function is a pure permission/definition filter only, and the legacy `hidden` branch is removed as dead code.
- New instances are placed in the **first free slot** the grid reports for the requested span.

### Edit mode

- The dashboard has an **explicit edit mode** (superseding ADR-0016). Outside it the surface is read-only for layout, fully interactive for content.
- **Gated to edit mode**: drag-to-move, resize handles, the visible grid, and the remove control.
- **Always available**: widget title rename and the config gear (non-spatial authoring).
- **Entry point**: a single ghost **Modifica/Fine** control in the dashboard header, beside the save indicator; it gains a pencil glyph and turns primary as "Fine" while editing. No floating action button for edit mode.
- **Auto-save is retained**: dropping the mode switch does not reintroduce Save/Cancel; every change persists with the existing debounce and indicator.

### Adding and removing

- A persistent, bottom-right `+` control opens the permission-filtered **Widget library** and is available in both modes; adding is additive, so it is not gated to edit mode.
- A chosen widget is placed in the first free slot and highlighted briefly.
- The trailing `+` grid tile is retired; the empty-dashboard prompt still opens the library.
- Removal is the X in edit mode; a removed widget is re-added from the library.

### Responsiveness and touch

- Below `md`, the desktop arrangement collapses to a **single column** ordered by row then column; no per-breakpoint layout is stored.
- On a coarse pointer (touch), **resize is unavailable**; reordering via the drag handle remains available in edit mode.

### Accessibility

- `react-grid-layout` provides no keyboard move/resize, so each card exposes a **keyboard-accessible layout control** in edit mode: the widget size menu is generalized to set width/height and to move the widget up/down, using the size presets as its steps.
- Layout changes are announced via an `aria-live` region.

### Removal of the old model

- The row-packing helper and its test are deleted, along with the fixed column-span utilities it fed.
- The size menu is **transformed** into the keyboard layout control (its labels are kept).
- The sortable cell and the six-column grid component are replaced by the `react-grid-layout` grid and its item wrapper.
- The pure edit helpers change: `addInstance` computes a free slot, and the index-based move becomes a placement update; the config/title update and remove helpers survive.
- ADR-0016 and ADR-0017 are marked superseded by the two new ADRs; ADR-0015 (registry + per-user JSON) remains valid.

## Testing Decisions

- Good tests here assert **external behaviour of pure functions**: given placements and definitions in, placements and resolved bounds out. No test asserts `react-grid-layout` internals.
- The **pure layout function** is tested in isolation: filtering saved instances by definition existence and permission, preserving placement, dropping unknown/unpermitted instances, and no longer handling a `hidden` state.
- The **placement helpers** are unit-tested: resolving a definition's size preset into a seed placement and bounds, applying a placement update by key, and computing the first free slot for a new instance of a given span.
- The **persistence path** is integration-tested: `dashboard.saveLayout` round-trips a placement alongside config and title for the current user only, and requires `dashboard.read`.
- The **registry** is tested for shape: each definition declares a valid size preset and its resolved bounds.
- Manual acceptance covers the parts no unit test can reach: drag, resize, compaction, edit-mode entry/exit, the `+` library flow with first-free-slot placement, single-column collapse, touch behaviour, and the keyboard layout control.
- Prior art: the existing pure-helper and procedure tests in the dashboard module (`edit-layout`, `layout`, `procedures`, `registry`) are the template.

## Out of Scope

- Per-breakpoint saved layouts (each breakpoint arranged independently).
- Multiple named dashboards per user.
- Explicit per-role default layouts and an admin UI to configure them.
- Freeform (non-snapping) placement, z-ordering, or overlapping widgets.
- Full pointer-free move/resize (arrow-key roving grid); the keyboard layout control is the a11y path for v1.
- Per-user data scoping of operational widgets; operational data stays global.
- Real-time or auto-refreshing widget data.

## Further Notes

- Decisions are recorded in `docs/adr/0018-dashboard-positioned-grid.md` (supersedes 0017) and `docs/adr/0019-dashboard-explicit-edit-mode.md` (supersedes 0016).
- `CONTEXT.md` is updated: **Dashboard layout** is now a positioned arrangement, and **Widget size preset** is a new term.
- There is no migration: the feature has never shipped, so the stored shape changes freely and the `hidden` legacy branch is deleted.
- The container-width measurement must be guarded to avoid a hydration mismatch in the App Router (measure after mount); this is an implementation note for the grid ticket, not a product decision.
