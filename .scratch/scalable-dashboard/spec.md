# Scalable Dashboard

## Problem Statement

The admin landing page at `/admin/dashboard` is a hardcoded two-widget grid (`src/modules/dashboard/ui/views/dashboard-view.tsx`) showing a subscriptions chart and an ebook-downloads chart. It is not modular, not extensible, and not personalizable. Adding a widget means editing the view by hand; there is no notion of a widget catalog, no layout, and no way for a backoffice user to arrange what they see.

The CMS everywhere else has moved to generic, registry-driven, permission-scoped modules (content versioning, the automation node catalog, the forms builder). The dashboard is the last surface that has not. It also collides, by name only, with the existing public-site `Widget` model (`prisma/schema.prisma:74`), which is unrelated.

This work restarts the dashboard from a clean point: a modular, scalable, and optionally personalized dashboard built on the CMS data already available, and settles the vocabulary so "widget" is unambiguous.

## Solution

A registry-driven dashboard composed of two layers:

- A **fascia operativa** ("what needs my attention now") of self-contained operational widgets, global in their data but arranged per user.
- A **fascia analytics** of a single generic **Trend** widget rendered once per **Metric**, sharing one date range.

Each dashboard unit is a **Dashboard widget**, an instance of a code-defined **Widget definition**. The registry is a **catalog**, not a default: a new user's dashboard is empty and every widget is added from the library, filtered by the permission each definition declares. The dashboard is **always arrangeable** — there is no edit mode: the user reorders, resizes, removes, adds, configures, and renames widgets directly, and each change is persisted automatically. The layout is stored per user as a JSON document. Each card reads as a self-description: its title (which the user may rename in place, and which a Trend derives from its metric), the definition's one-line description, and a compact row of its active filters — so a glance is enough to know what a widget is and how it is narrowed. Analytics are backed by a server-side **Metric** registry, so a new metric is a new registry entry, not a new widget.

## User Stories

1. As a backoffice user, I want a dashboard that immediately shows what needs my attention (drafts to publish, scheduled content, reviews to moderate, orders to complete, failed automations), so that I can act without hunting through the CMS.
2. As a backoffice user, I want analytics trends (contact growth, form submissions, ebook downloads, revenue/orders) over a date range, so that I can see how the site is performing.
3. As a backoffice user, I want to see only the widgets I have permission for, so that I am not shown data I cannot access.
4. As a backoffice user, I want to reorder widgets by dragging directly on the dashboard, so that it reflects my priorities without entering a separate mode.
5. As a backoffice user, I want to remove widgets I do not care about and re-add them later from a widget library, so that I can tailor the dashboard without losing options.
6. As a backoffice user, I want to add widgets and choose which metric each Trend shows, so that I can watch several metrics at once.
7. As a backoffice user, I want to resize each widget among a small set of sizes, so that I can give more room to what matters.
8. As a backoffice user, I want my arrangement saved automatically, so that I never have to commit it explicitly.
9. As a backoffice user, I want a brand-new dashboard to be empty with a prompt to add a widget, so that I only see what I choose.
10. As a developer, I want to add a new dashboard widget by creating one module and registering it, so that extending the dashboard never requires touching the view.
11. As a developer, I want to add a new analytics metric by registering a metric source, so that the Trend widget supports it with no new UI.
12. As a developer, I want adding or removing a definition to change only the catalog and the library, with no data migration, so that the dashboard evolves safely.
13. As a backoffice user, I want each widget to show what it is and which filters are active, so that I can read the dashboard at a glance and trust what I am looking at.
14. As a backoffice user, I want to rename a widget — and see a Trend name itself after its metric — so that each card matches how I think about my work.

## Implementation Decisions

### Vocabulary

- **Dashboard widget**: a self-contained unit displayed on the dashboard, governed by the permission it declares, arranged by the user. Distinct from the public **Site widget** (`Widget` model).
- **Widget definition**: the code-defined catalog entry for a kind of Dashboard widget. Definitions are code, not database rows, and each is owned by the module whose data its widget presents.
- **Metric**: a named, permission-scoped time series exposed by the metric registry and rendered by the Trend widget.
- **Dashboard layout**: the ordered set of Dashboard widgets a user sees.

These are recorded in `CONTEXT.md` under "Admin dashboard".

### Widget registry

- Dashboard widgets are **code-defined via a registry**, not database-defined. Each definition is **owned by the module whose data its widget presents**; the dashboard is a *composition root* that aggregates the module exports (`src/modules/dashboard/registry.ts`) into a `WidgetDefinition[]` and adds the generic Trend.
- The shared contract (`WidgetDefinition`, `WidgetComponentProps`, the instance type, `Metric`) lives in `src/shared/dashboard/`, so a domain module depends on the contract, never on the dashboard.
- The `WidgetDefinition` contract is:
  `{ id, title, description?, icon, permission?, defaultSize, component, configSchema?, defaultConfig?, resolveTitle?, summarizeConfig? }`.
  - `permission` is optional: operational widgets declare the permission of the area whose data they show; the Trend widget derives its availability from the metrics the user may read.
  - `defaultSize` is a discrete token from a small set (`small`, `medium`, `full`), the size a freshly added instance starts at. The user may override it per instance (see Layout model).
  - `configSchema`/`defaultConfig` are optional; any definition may become configurable without a model change. The Trend widget is the first user.
- Each widget is **autonomous**: it owns its data query and is wrapped in its own `Suspense` and `ErrorBoundary`. The dashboard does not know about widget queries. A widget's query lives in the owning module's router (e.g. `posts.getDrafts`, `orders.getPendingOrders`).
- Permissions **reuse existing area permissions** (`contacts.read`, `orders.read`, `reviews.read`, `automations.read`, `posts.read`, `submissions.read`). No new widget-level permissions are introduced. `dashboard.read` remains the gate to view the dashboard and to save one's own layout.
- There is **no default layout**: the registry is a catalog, and a user who has saved nothing has an empty dashboard. The effective layout is the user's saved instances filtered to the definitions that still exist and are permitted. No `Role -> layout` table or admin UI exists.

### Metric registry

- The metric registry aggregates metrics that live server-side in the modules that own their data, exposing metrics of shape `{ id, label, permission, timeSeries(from, to) }`. The Trend widget and the `dashboard.getMetrics`/`getMetricSeries` procedures stay in the dashboard (they are generic); each `Metric` is owned by its domain module.
- The Trend widget exposes **only the metrics the user is permitted to read**. If the user has none, the Trend widget is hidden.
- Metrics that reuse an existing query do so; v1 metrics are:
  - **Iscritti / contatti** (`contacts.read`) — reuses `contacts.getContactsGrowth`.
  - **Form submissions** (`submissions.read`) — new aggregation over `FormSubmission.createdAt`.
  - **Download ebook** (`dashboard.read`) — wraps the existing `/api/ebooks/stats` logic (migrate to a tRPC procedure).
  - **Ricavi / ordini** (`orders.read`) — new aggregation over `Order.totalAmount` / `Payment`.

### Layout model

- A user's layout is stored in a `DashboardLayout` model, 1:1 with `User`, holding a JSON document typed as `DashboardWidgets`.
- The JSON is a **list of instances**, each `{ key, definitionId, config?, size? }`, where `key` is a stable instance key generated at creation (e.g. `trend-<uuid>`), so reordering, reconfiguring, or resizing an instance never changes its identity.
- **Multiple instances of the same definition are allowed** (e.g. two Trend widgets with different metrics).
- There is **no registry default**. The effective layout is the saved instances filtered to those whose definition exists and is still permitted — a pure, tested function. A legacy `hidden` entry (from the earlier hide behaviour) is discarded on read rather than rendered.
- `size` is optional: when absent the definition's `defaultSize` applies, so a saved layout tracks a changed default until the user resizes that instance.

### Arranging (always on)

- There is **no edit mode**. The dashboard is always arrangeable: every card's arrange controls (size, config, remove, drag) are mounted, revealed on hover/focus on pointer devices and kept visible on small (touch) screens.
- Widget bodies stay interactive (links clickable); dragging is confined to the drag handle, so no body lock is needed.
- A **size menu** on every card resizes just that instance among `small`/`medium`/`full`.
- A **`+` tile** at the end of the grid — and the empty-dashboard prompt — opens a **widget library** filtered by permission; picking an entry adds an instance at the end of the grid.
- Each card shows an **X to remove** it: the instance leaves the layout (there is no hidden state), and re-adding it from the library appends a fresh instance at the end.
- A **gear** on a configurable card opens a **popover generated from `configSchema`** (for the Trend, the metric picker).
- Changes are persisted with **auto-save**: the whole instance document is saved (debounced) after each change, with a subtle "Saving…/Saved" indicator in the header and a toast only on error. There is no Save/Cancel. A change still inside the debounce window is flushed when the page is left, so the last edit is never dropped.
- Persistence is via a `dashboard.saveLayout` mutation that operates only on the current user's `DashboardLayout`.

### Widget chrome (title, description, filters)

- Each card shows the widget's **title** and, beneath it, its **description** — the definition's static explanatory line, always visible as one muted, clamped line. This is the same text the library already uses to describe the kind; it is not editable per instance.
- A Dashboard widget may be **renamed per instance**. The effective title resolves as: the instance's `title` override when set, else the definition's config-derived default, else the definition's static title. The override is an optional `title` on the instance, persisted in the same per-user JSON as `size`; clearing it reverts to the default. The definition may supply the middle layer via `resolveTitle?(context, config)` so a Trend defaults to its **metric's label** ("Contacts", not "Trend") and follows metric changes; the override still wins.
- Renaming is **in place and keyboard-accessible**: the title is a focusable, hover/focus-revealed trigger that becomes an input on activation (Enter/blur saves, Escape reverts). The automation editor's name input is the precedent, upgraded with keyboard access.
- A card surfaces its **active filters** as chips next to its title. A definition implements `summarizeConfig?(config, context): WidgetFilterChip[]` — the counterpart of `configSchema` — returning the selection in effect, always shown even at its default, so the generic card stays ignorant of each domain's field semantics and default rules. V1: the Trend summarizes its **form** filter (count, with the names in a tooltip; "All forms" when nothing is narrowed) but not its metric, which is the subject named in the title; drafts and scheduled summarize their status/type filters, showing the default selection when nothing narrowed it.
- The chips of a configurable widget **open that widget's config popover**, tying "what is filtered" to the control that changes it.
- The effective title is used everywhere the card names the widget (the visible title and the arrange controls' `aria-label`s); the library keeps listing definitions by their default title.

### Date range

- A single global date range governs **only the analytics widgets**. Operational widgets are always "now" and ignore it.
- The existing `use-date-range-store` and `DatePickerWithRange` are reused; the range control moves into the analytics section.

### Widget catalog (v1)

The registry is a catalog, not a default layout: a new user's dashboard is **empty** and these are added from the library. Six definitions:

Operational (global data, `count + short list + filtered click-through`):

| Widget | Permission | Source |
|---|---|---|
| Latest Posts | `posts.read` | `PostVersion` by status |
| Scheduled Content | `posts.read` | `ScheduledAction` / `scheduledAt` |
| Reviews | `reviews.read` | `Reviews.status = false` |
| Orders | `orders.read` | `Order.status in (PENDING)` |
| Automation Runs | `automations.read` | `AutomationRun.status = FAILED` |

Widget titles are deliberately generic; the active filter chip that sits next to each title carries the specifics (e.g. which statuses Latest Posts shows).

Analytics: a single Trend definition, configurable per instance to any permitted metric — Contacts, Form submissions, Ebook downloads, Revenue / orders.

### Module shape

```
src/shared/dashboard/          # the contract both the dashboard and the modules depend on
  types.ts                     # WidgetDefinition, DashboardWidgetInstance, Metric, config schema types
  ui/                          # WidgetList, WidgetEmpty/states shared by every widget
  metrics/series.ts            # metric series helpers
src/modules/dashboard/         # the composition root
  registry.ts                  # aggregates the modules' WidgetDefinition[] + the Trend
  server/
    procedures.ts              # dashboard.getLayout, dashboard.saveLayout, getMetrics, getMetricSeries
    layout.ts                  # pure permission filter of the saved layout
    metrics/registry.ts        # aggregates the modules' Metric[]
    prefetch.ts
  ui/
    views/dashboard-view.tsx   # rewritten
    components/                # grid, widget-card, sortable-widget, widget-size-menu, widget-library, dashboard-empty, config-popover
    widgets/trend-widget.tsx   # the generic Trend (the only dashboard-owned widget)
    hooks/
src/modules/<domain>/          # each domain owns the widgets and metrics whose data it presents
  widgets/                     # the widget component + its WidgetDefinition[]
  server/metrics.ts            # its Metric[] (where applicable)
```

### Schema shape

```prisma
model DashboardLayout {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  /// [DashboardWidgets]
  widgets   Json     @default("[]") @db.JsonB
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

`User` gains `dashboardLayout DashboardLayout?`. The JSON type is declared in `src/types.ts`:

```ts
namespace PrismaJson {
  type DashboardWidgets = DashboardWidgetInstance[];
}
```

## Testing Decisions

- Vitest against the real test database, following the existing project pattern (`tests/global-setup.ts` runs migrations; `beforeEach` cleanup; direct `db` calls).
- The pure **layout function** is unit-tested in isolation: filtering the saved instances by permission, dropping unknown/unpermitted definitions and legacy hidden entries, preserving order, and multi-instance stability.
- The **registry** is tested for shape and permission filtering (catalog order, per-definition permissions, `defaultSize`) and for the Trend's config schema.
- The pure **edit helpers** (`addInstance`, `removeInstance`, `moveInstance`, `updateInstance`) are unit-tested in isolation.
- The **`dashboard.saveLayout`** procedure is integration-tested: it persists only for the current user, requires `dashboard.read`, and round-trips an instance's config and size.
- **Metric `timeSeries`** functions are tested for correct period bucketing and permission scoping, in the module that owns each metric.
- Each **operational widget's query** (e.g. `posts.getDrafts`) is integration-tested in its module.
- Manual acceptance covers arranging, which is always on: drag reorder, remove/re-add via the library, add a Trend and change its metric, resize a widget, the empty first-run state, and auto-save persistence across reload.

## Out of Scope

- Explicit per-role default layout stored in the database and an admin UI to configure it.
- A seeded default layout: a new user's dashboard starts empty.
- Multiple named dashboards per user.
- Independent date ranges per analytics widget.
- Per-user data scoping of operational widgets (e.g. "my drafts"); operational data is global in v1.
- Data-driven widget definitions in the database (a mini page-builder).
- Real-time or auto-refreshing widget data.

## Further Notes

- **Verification needed before implementing click-through**: confirm that each destination list view accepts its status filter via URL query parameters (drafts -> `/admin/posts?status=DRAFT`, orders -> `/admin/shop/orders?status=PENDING`, reviews -> `/admin/shop/reviews`, failed runs -> `/admin/automations/.../executions`, scheduled -> `/admin/schedule`). If a view does not read query params today, add that support or an equivalent deep link.
- The existing `/api/ebooks/stats` REST endpoint and `use-ebook-stats-query` axios hook should be folded into the metric registry (tRPC) so the dashboard has a single data convention.
- ADR-0015 records the choice to define widgets in code via a registry with a per-user JSON layout (revised: the registry is a catalog owned by the domain modules, aggregated by the dashboard as a composition root). ADR-0016 records the choice to keep the dashboard always arrangeable with auto-save instead of an edit mode with an explicit Save/Cancel (revised: the X removes an instance, there is no hidden state).
- `CONTEXT.md` defines Dashboard widget, Widget definition, Widget title override, Widget filter, Dashboard layout, Site widget, and Metric.
- Widget chrome (per-instance title override, definition description, active-filter chips) is tracked as ticket 08. No ADR: the change is additive and easily reversible, so it is recorded in this spec and the glossary only. The chip row's placement in the header is provisional — a `full`-size widget may move it into the card body if the header gets tall.
