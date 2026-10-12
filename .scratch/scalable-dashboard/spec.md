# Scalable Dashboard

## Problem Statement

The admin landing page at `/admin/dashboard` is a hardcoded two-widget grid (`src/modules/dashboard/ui/views/dashboard-view.tsx`) showing a subscriptions chart and an ebook-downloads chart. It is not modular, not extensible, and not personalizable. Adding a widget means editing the view by hand; there is no notion of a widget catalog, no layout, and no way for a backoffice user to arrange what they see.

The CMS everywhere else has moved to generic, registry-driven, permission-scoped modules (content versioning, the automation node catalog, the forms builder). The dashboard is the last surface that has not. It also collides, by name only, with the existing public-site `Widget` model (`prisma/schema.prisma:74`), which is unrelated.

This work restarts the dashboard from a clean point: a modular, scalable, and optionally personalized dashboard built on the CMS data already available, and settles the vocabulary so "widget" is unambiguous.

## Solution

A registry-driven dashboard composed of two layers:

- A **fascia operativa** ("what needs my attention now") of self-contained operational widgets, global in their data but arranged per user.
- A **fascia analytics** of a single generic **Trend** widget rendered once per **Metric**, sharing one date range.

Each dashboard unit is a **Dashboard widget**, an instance of a code-defined **Widget definition**. The registry is a **catalog**, not a default: a new user's dashboard is empty and every widget is added from the library, filtered by the permission each definition declares. The dashboard is **always arrangeable** — there is no edit mode: the user reorders, resizes, hides, adds, and configures widgets directly, and each change is persisted automatically. The layout is stored per user as a JSON document. Analytics are backed by a server-side **Metric** registry, so a new metric is a new registry entry, not a new widget.

## User Stories

1. As a backoffice user, I want a dashboard that immediately shows what needs my attention (drafts to publish, scheduled content, reviews to moderate, orders to complete, failed automations), so that I can act without hunting through the CMS.
2. As a backoffice user, I want analytics trends (contact growth, form submissions, ebook downloads, revenue/orders) over a date range, so that I can see how the site is performing.
3. As a backoffice user, I want to see only the widgets I have permission for, so that I am not shown data I cannot access.
4. As a backoffice user, I want to reorder widgets by dragging directly on the dashboard, so that it reflects my priorities without entering a separate mode.
5. As a backoffice user, I want to hide widgets I do not care about and re-add them later from a widget library, so that I can tailor the dashboard without losing options.
6. As a backoffice user, I want to add widgets and choose which metric each Trend shows, so that I can watch several metrics at once.
7. As a backoffice user, I want to resize each widget among a small set of sizes, so that I can give more room to what matters.
8. As a backoffice user, I want my arrangement saved automatically, so that I never have to commit it explicitly.
9. As a backoffice user, I want a brand-new dashboard to be empty with a prompt to add a widget, so that I only see what I choose.
10. As a developer, I want to add a new dashboard widget by creating one module and registering it, so that extending the dashboard never requires touching the view.
11. As a developer, I want to add a new analytics metric by registering a metric source, so that the Trend widget supports it with no new UI.
12. As a developer, I want adding or removing a definition to change only the catalog and the library, with no data migration, so that the dashboard evolves safely.

## Implementation Decisions

### Vocabulary

- **Dashboard widget**: a self-contained unit displayed on the dashboard, governed by the permission it declares, arranged by the user. Distinct from the public **Site widget** (`Widget` model).
- **Widget definition**: the code-defined catalog entry for a kind of Dashboard widget. Definitions are code, not database rows.
- **Metric**: a named, permission-scoped time series exposed by the metric registry and rendered by the Trend widget.
- **Dashboard layout**: the ordered set of Dashboard widgets a user sees.

These are recorded in `CONTEXT.md` under "Admin dashboard".

### Widget registry

- Dashboard widgets are **code-defined via a registry**, not database-defined. A `registry.ts` in `src/modules/dashboard` imports each widget module and exports a `WidgetDefinition[]`.
- The `WidgetDefinition` contract is:
  `{ id, title, description?, icon, permission?, defaultSize, component, configSchema?, defaultConfig? }`.
  - `permission` is optional: operational widgets declare the permission of the area whose data they show; the Trend widget derives its availability from the metrics the user may read.
  - `defaultSize` is a discrete token from a small set (`small`, `medium`, `full`), the size a freshly added instance starts at. The user may override it per instance (see Layout model).
  - `configSchema`/`defaultConfig` are optional; any definition may become configurable without a model change. The Trend widget is the first user.
- Each widget is **autonomous**: it owns its data query and is wrapped in its own `Suspense` and `ErrorBoundary`. The dashboard does not know about widget queries.
- Permissions **reuse existing area permissions** (`contacts.read`, `orders.read`, `reviews.read`, `automations.read`, `posts.read`, `submissions.read`). No new widget-level permissions are introduced. `dashboard.read` remains the gate to view the dashboard and to save one's own layout.
- There is **no default layout**: the registry is a catalog, and a user who has saved nothing has an empty dashboard. The effective layout is the user's saved instances filtered to the definitions that still exist and are permitted. No `Role -> layout` table or admin UI exists.

### Metric registry

- The metric registry lives server-side at `src/modules/dashboard/server/metrics`, exposing metrics of shape `{ id, label, permission, timeSeries(from, to) }`.
- The Trend widget exposes **only the metrics the user is permitted to read**. If the user has none, the Trend widget is hidden.
- Metrics that reuse an existing query do so; v1 metrics are:
  - **Iscritti / contatti** (`contacts.read`) — reuses `contacts.getContactsGrowth`.
  - **Form submissions** (`submissions.read`) — new aggregation over `FormSubmission.createdAt`.
  - **Download ebook** (`dashboard.read`) — wraps the existing `/api/ebooks/stats` logic (migrate to a tRPC procedure).
  - **Ricavi / ordini** (`orders.read`) — new aggregation over `Order.totalAmount` / `Payment`.

### Layout model

- A user's layout is stored in a `DashboardLayout` model, 1:1 with `User`, holding a JSON document typed as `DashboardWidgets`.
- The JSON is a **list of instances**, each `{ key, definitionId, config?, hidden?, size? }`, where `key` is a stable instance key generated at creation (e.g. `trend-<uuid>`), so reordering, reconfiguring, or resizing an instance never changes its identity.
- **Multiple instances of the same definition are allowed** (e.g. two Trend widgets with different metrics).
- There is **no registry default**. The effective layout is the saved instances filtered to those whose definition exists and is still permitted — a pure, tested function. Hidden instances remain in the document (so they can be re-added from the library) but are not rendered.
- `size` is optional: when absent the definition's `defaultSize` applies, so a saved layout tracks a changed default until the user resizes that instance.

### Arranging (always on)

- There is **no edit mode**. The dashboard is always arrangeable: every card's arrange controls (size, config, hide, drag) are mounted, revealed on hover/focus on pointer devices and kept visible on small (touch) screens.
- Widget bodies stay interactive (links clickable); dragging is confined to the drag handle, so no body lock is needed.
- A **size menu** on every card resizes just that instance among `small`/`medium`/`full`.
- A **`+` tile** at the end of the grid — and the empty-dashboard prompt — opens a **widget library** filtered by permission; picking an entry adds an instance.
- Each card shows an **X to hide** it, which sets `hidden` (the entry stays re-addable from the library).
- A **gear** on a configurable card opens a **popover generated from `configSchema`** (for the Trend, the metric picker).
- Changes are persisted with **auto-save**: the whole instance document is saved (debounced) after each change, with a subtle "Saving…/Saved" indicator in the header and a toast only on error. There is no Save/Cancel. A change still inside the debounce window is flushed when the page is left, so the last edit is never dropped.
- Persistence is via a `dashboard.saveLayout` mutation that operates only on the current user's `DashboardLayout`.

### Date range

- A single global date range governs **only the analytics widgets**. Operational widgets are always "now" and ignore it.
- The existing `use-date-range-store` and `DatePickerWithRange` are reused; the range control moves into the analytics section.

### Widget catalog (v1)

The registry is a catalog, not a default layout: a new user's dashboard is **empty** and these are added from the library. Six definitions:

Operational (global data, `count + short list + filtered click-through`):

| Widget | Permission | Source |
|---|---|---|
| Drafts to publish | `posts.read` | `PostVersion.status = DRAFT` |
| Scheduled content | `posts.read` | `ScheduledAction` / `scheduledAt` |
| Reviews to moderate | `reviews.read` | `Reviews.status = false` |
| Orders to fulfil | `orders.read` | `Order.status in (PENDING)` |
| Failed automations | `automations.read` | `AutomationRun.status = FAILED` |

Analytics: a single Trend definition, configurable per instance to any permitted metric — Contacts, Form submissions, Ebook downloads, Revenue / orders.

### Module shape

```
src/modules/dashboard/
  registry.ts                 # WidgetDefinition[] (imports widget modules)
  types.ts                    # WidgetDefinition, DashboardWidgetInstance, Metric, config schema types
  server/
    procedures.ts             # dashboard.getLayout, dashboard.saveLayout
    layout.ts                 # pure permission filter of the saved layout
    metrics/                  # metric registry + one file per metric
    prefetch.ts
  ui/
    views/dashboard-view.tsx  # rewritten
    components/               # grid, widget-card, sortable-widget, widget-size-menu, widget-library, dashboard-empty, config-popover, widget-states
    widgets/                  # operational widget modules
    hooks/
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
- The pure **layout function** is unit-tested in isolation: filtering the saved instances by permission, dropping unknown/unpermitted definitions, preserving order, keeping hidden instances, and multi-instance stability.
- The **registry** is tested for shape and permission filtering (catalog order, per-definition permissions, `defaultSize`) and for the Trend's config schema.
- The pure **edit helpers** (`addInstance`, `hideInstance`, `moveInstance`, `resizeInstance`, `configureInstance`) are unit-tested in isolation.
- The **`dashboard.saveLayout`** procedure is integration-tested: it persists only for the current user, requires `dashboard.read`, and round-trips an instance's config and size.
- **Metric `timeSeries`** functions are tested for correct period bucketing and permission scoping.
- Manual acceptance covers arranging, which is always on: drag reorder, hide/re-add via the library, add a Trend and change its metric, resize a widget, the empty first-run state, and auto-save persistence across reload.

## Out of Scope

- Explicit per-role default layout stored in the database and an admin UI to configure it.
- A seeded default layout: a new user's dashboard starts empty.
- Multiple named dashboards per user.
- Independent date ranges per analytics widget.
- Per-user data scoping of operational widgets (e.g. "my drafts"); operational data is global in v1.
- Data-driven widget definitions in the database (a mini page-builder).
- Real-time or auto-refreshing widget data.
- Custom per-instance widget titles.

## Further Notes

- **Verification needed before implementing click-through**: confirm that each destination list view accepts its status filter via URL query parameters (drafts -> `/admin/posts?status=DRAFT`, orders -> `/admin/shop/orders?status=PENDING`, reviews -> `/admin/shop/reviews`, failed runs -> `/admin/automations/.../executions`, scheduled -> `/admin/schedule`). If a view does not read query params today, add that support or an equivalent deep link.
- The existing `/api/ebooks/stats` REST endpoint and `use-ebook-stats-query` axios hook should be folded into the metric registry (tRPC) so the dashboard has a single data convention.
- ADR-0015 records the choice to define widgets in code via a registry with a per-user JSON layout (revised: the registry is a catalog, not a default layout). ADR-0016 records the choice to keep the dashboard always arrangeable with auto-save instead of an edit mode with an explicit Save/Cancel.
- `CONTEXT.md` defines Dashboard widget, Widget definition, Dashboard layout, Site widget, and Metric.
