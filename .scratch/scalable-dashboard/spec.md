# Scalable Dashboard

## Problem Statement

The admin landing page at `/admin/dashboard` is a hardcoded two-widget grid (`src/modules/dashboard/ui/views/dashboard-view.tsx`) showing a subscriptions chart and an ebook-downloads chart. It is not modular, not extensible, and not personalizable. Adding a widget means editing the view by hand; there is no notion of a widget catalog, no layout, and no way for a backoffice user to arrange what they see.

The CMS everywhere else has moved to generic, registry-driven, permission-scoped modules (content versioning, the automation node catalog, the forms builder). The dashboard is the last surface that has not. It also collides, by name only, with the existing public-site `Widget` model (`prisma/schema.prisma:74`), which is unrelated.

This work restarts the dashboard from a clean point: a modular, scalable, and optionally personalized dashboard built on the CMS data already available, and settles the vocabulary so "widget" is unambiguous.

## Solution

A registry-driven dashboard composed of two layers:

- A **fascia operativa** ("what needs my attention now") of self-contained operational widgets, global in their data but arranged per user.
- A **fascia analytics** of a single generic **Trend** widget rendered once per **Metric**, sharing one date range.

Each dashboard unit is a **Dashboard widget**, an instance of a code-defined **Widget definition**. The default layout is declared in the registry and filtered by the permission each definition declares, so a role's default emerges from its permissions with no per-role storage. A backoffice user can reorder, hide, add, and configure widgets in an in-place edit mode; the override is stored per user as a sparse JSON document merged over the registry defaults. Analytics are backed by a server-side **Metric** registry, so a new metric is a new registry entry, not a new widget.

## User Stories

1. As a backoffice user, I want a dashboard that immediately shows what needs my attention (drafts to publish, scheduled content, reviews to moderate, orders to complete, failed automations), so that I can act without hunting through the CMS.
2. As a backoffice user, I want analytics trends (contact growth, form submissions, ebook downloads, revenue/orders) over a date range, so that I can see how the site is performing.
3. As a backoffice user, I want to see only the widgets I have permission for, so that I am not shown data I cannot access.
4. As a backoffice user, I want to enter an edit mode and reorder widgets by dragging, so that the dashboard reflects my priorities.
5. As a backoffice user, I want to hide widgets I do not care about and re-add them later from a widget library, so that I can tailor the dashboard without losing options.
6. As a backoffice user, I want to add additional Trend widgets and choose which metric each shows, so that I can watch several metrics at once.
7. As a backoffice user, I want to save or cancel my changes explicitly, so that I do not persist a layout by accident.
8. As a developer, I want to add a new dashboard widget by creating one module and registering it, so that extending the dashboard never requires touching the view.
9. As a developer, I want to add a new analytics metric by registering a metric source, so that the Trend widget supports it with no new UI.
10. As a developer, I want the default layout to update cleanly when the registry changes (a new widget appears, a removed one disappears) without data migrations, so that the dashboard evolves safely.
11. As an admin, I want the dashboard default to follow a role's permissions automatically, so that I do not configure a layout per role in v1.

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
  `{ id, title, description?, icon, permission?, size, component, configSchema?, defaultConfig? }`.
  - `permission` is optional: operational widgets declare the permission of the area whose data they show; the Trend widget derives its availability from the metrics the user may read.
  - `size` is a discrete token from a small set (e.g. `small`, `medium`, `full`), fixed per definition in v1.
  - `configSchema`/`defaultConfig` are optional; any definition may become configurable without a model change. The Trend widget is the first user.
- Each widget is **autonomous**: it owns its data query and is wrapped in its own `Suspense` and `ErrorBoundary`. The dashboard does not know about widget queries.
- Permissions **reuse existing area permissions** (`contacts.read`, `orders.read`, `reviews.read`, `automations.read`, `posts.read`, `submissions.read`). No new widget-level permissions are introduced. `dashboard.read` remains the gate to view the dashboard and to save one's own layout.
- A permission **data source is the code-defined default order filtered by permission**. A role's default layout is therefore emergent; no `Role -> layout` table or admin UI exists in v1.

### Metric registry

- The metric registry lives server-side at `src/modules/dashboard/server/metrics`, exposing metrics of shape `{ id, label, permission, timeSeries(from, to) }`.
- The Trend widget exposes **only the metrics the user is permitted to read**. If the user has none, the Trend widget is hidden.
- Metrics that reuse an existing query do so; v1 metrics are:
  - **Iscritti / contatti** (`contacts.read`) — reuses `contacts.getContactsGrowth`.
  - **Form submissions** (`submissions.read`) — new aggregation over `FormSubmission.createdAt`.
  - **Download ebook** (`dashboard.read`) — wraps the existing `/api/ebooks/stats` logic (migrate to a tRPC procedure).
  - **Ricavi / ordini** (`orders.read`) — new aggregation over `Order.totalAmount` / `Payment`.

### Layout model

- Per-user override is stored in a `DashboardLayout` model, 1:1 with `User`, holding a JSON document typed as `DashboardWidgets`.
- The JSON is a **list of instances**, each `{ key, definitionId, config?, hidden? }`, where `key` is a stable instance key:
  - Registry default instances use deterministic keys (e.g. `drafts`, `scheduled`, `trend-contacts`, `trend-submissions`, `trend-ebooks`, `trend-revenue`).
  - User-created instances get a generated key at creation, so reordering/config edits never change identity.
- **Multiple instances of the same definition are allowed** (e.g. two Trend widgets with different metrics).
- The registry declares the **default instances**; the effective layout is computed by a pure, tested merge:
  1. Start from the default instances, filtered to those whose definition (or metric) is permitted to the user.
  2. Overlay the saved instances by `key`: saved order sets relative order; saved `hidden`/`config` override defaults.
  3. Append default instances not present in the saved document (so new registry defaults appear automatically).
  4. Drop saved instances whose `definitionId` is no longer in the registry or no longer permitted.
  5. Hidden instances remain in the document (so they can be re-added) but are not rendered.
- `size` is not user-adjustable in v1; the field may be stored in the instance for forward compatibility but is not required.

### Edit mode

- Edit mode is entered with an explicit **Modifica / Fine** toggle in the dashboard header.
- In edit mode:
  - Widgets are **dragged to reorder** using `@dnd-kit/react` (already used by the forms builder).
  - A **`+` tile** at the end of the grid opens a **widget library** filtered by permission; picking an entry adds an instance.
  - Each card shows an **X to hide** it, which sets `hidden` (the entry stays re-addable from the library).
  - A **gear** on a configurable card opens a **popover generated from `configSchema`** (for the Trend, the metric picker).
  - Widgets remain rendered with real data but **interactions are disabled**, so refetches do not compete with dragging.
- Changes are persisted with an explicit **Salva / Annulla** (no auto-save).
- Persistence is via a `dashboard.saveLayout` mutation that operates only on the current user's `DashboardLayout`.

### Date range

- A single global date range governs **only the analytics widgets**. Operational widgets are always "now" and ignore it.
- The existing `use-date-range-store` and `DatePickerWithRange` are reused; the range control moves into the analytics section.

### Default catalog (v1)

Nine default instances: five operational widgets plus four Trend instances.

Operational (global data, `count + short list + filtered click-through`):

| Widget | Permission | Source |
|---|---|---|
| Bozze da pubblicare | `posts.read` | `PostVersion.status = DRAFT` |
| Contenuti in programmazione | `posts.read` | `ScheduledAction` / `scheduledAt` |
| Recensioni da moderare | `reviews.read` | `Reviews.status = false` |
| Ordini da completare | `orders.read` | `Order.status in (PENDING)` |
| Automazioni in errore | `automations.read` | `AutomationRun.status = FAILED` |

Analytics (one Trend definition, four seeded instances): Iscritti/contatti, Form submissions, Download ebook, Ricavi/ordini.

### Module shape

```
src/modules/dashboard/
  registry.ts                 # WidgetDefinition[] (imports widget modules)
  types.ts                    # WidgetDefinition, DashboardWidgetInstance, Metric, config schema types
  server/
    procedures.ts             # dashboard.getLayout, dashboard.saveLayout
    layout.ts                 # pure merge function
    metrics/                  # metric registry + one file per metric
    prefetch.ts
  ui/
    views/dashboard-view.tsx  # rewritten
    components/               # grid, widget-card, edit-toolbar, widget-library, config-popover, analytics-range
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
- The pure **merge function** is unit-tested in isolation: filtering by permission, key overlay, appending new defaults, dropping unknown/unpermitted definitions, hidden-but-retained entries, and multi-instance ordering stability.
- The **registry** and **metric registry** are tested for permission filtering: a user without `orders.read` never sees the revenue metric nor an order-gated widget.
- The **`dashboard.saveLayout`** procedure is integration-tested: it persists only for the current user, requires `dashboard.read`, and round-trips an override that the merge then reflects.
- **Metric `timeSeries`** functions are tested for correct period bucketing and permission scoping.
- Manual acceptance covers the in-place edit mode: drag reorder, hide/readd via library, add a Trend and change its metric, Salva/Annulla, and persistence across reload.

## Out of Scope

- Explicit per-role default layout stored in the database and an admin UI to configure it.
- User-adjustable widget sizes (resize).
- Multiple named dashboards per user.
- Independent date ranges per analytics widget.
- Per-user data scoping of operational widgets (e.g. "my drafts"); operational data is global in v1.
- Data-driven widget definitions in the database (a mini page-builder).
- Real-time or auto-refreshing widget data.
- Custom per-instance widget titles.

## Further Notes

- **Verification needed before implementing click-through**: confirm that each destination list view accepts its status filter via URL query parameters (drafts -> `/admin/posts?status=DRAFT`, orders -> `/admin/shop/orders?status=PENDING`, reviews -> `/admin/shop/reviews`, failed runs -> `/admin/automations/.../executions`, scheduled -> `/admin/schedule`). If a view does not read query params today, add that support or an equivalent deep link.
- The existing `/api/ebooks/stats` REST endpoint and `use-ebook-stats-query` axios hook should be folded into the metric registry (tRPC) so the dashboard has a single data convention.
- ADR-0015 records the choice to define widgets in code and merge a sparse per-user JSON override, rather than a database-driven widget model.
- `CONTEXT.md` defines Dashboard widget, Widget definition, Dashboard layout, Site widget, and Metric.
