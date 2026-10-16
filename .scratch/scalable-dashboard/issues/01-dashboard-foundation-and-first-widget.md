# 01: Dashboard foundation and first widget (read-only)

**What to build:** The dashboard is served from a code-defined widget registry instead of a hardcoded view. A Dashboard widget is an instance of a Widget definition; the default layout is the registry's default instances filtered by the permission each definition declares. A per-user Dashboard layout is persisted (not yet editable). `/admin/dashboard` renders a responsive grid of the permitted default widgets, containing one working operational widget — Bozze da pubblicare — with count, a short list, and a link to the filtered posts list.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A per-user dashboard layout is persisted in a dedicated model as a list of dashboard widget instances, each with a stable key, a definition id, an optional config, and a hidden flag.
- [x] A widget definition contract exists and includes id, title, description, icon, permission, size, and component, plus optional config schema and default config.
- [x] A registry exposes the default instances and their order.
- [x] The effective layout is computed by a pure, tested merge: defaults filtered by permission, override applied by key, unknown or unpermitted definitions dropped, hidden instances retained but not rendered.
- [x] `/admin/dashboard` renders the permitted default widgets in a responsive grid using discrete size tokens.
- [x] The Bozze da pubblicare widget shows the count of posts in DRAFT, a short list of the most relevant ones, and a link to the filtered posts list.
- [x] A user lacking a widget's declared permission never sees that widget.
- [x] Merge and permission filtering are covered by tests.

## Comments

Delivered:

- `DashboardLayout` model (1:1 with `User`, sparse `widgets` JsonB) + migration `20261012120000_add_dashboard_layout`; `PrismaJson.DashboardWidgets` declared in `src/types.ts`.
- `src/modules/dashboard/types.ts` — `WidgetDefinition`, `DashboardWidgetInstance`, `WidgetSize`, `WidgetComponentProps`.
- `src/modules/dashboard/registry.ts` — code-defined `WIDGET_DEFINITIONS` and `DEFAULT_DASHBOARD_INSTANCES` (ordered).
- `src/modules/dashboard/server/layout.ts` — pure `computeDashboardLayout` (permission filter, key overlay, append new defaults, drop unknown/unpermitted) and `visibleDashboardWidgets` (hidden retained, not rendered).
- `src/modules/dashboard/server/procedures.ts` — `dashboard.getLayout`, `dashboard.saveLayout`, `dashboard.getDrafts`; router registered in `src/trpc/routers/_app.ts`. `dashboard.read` gates the layout procedures (see `src/shared/lib/permissions.ts`); drafts require `posts.read`.
- `src/modules/dashboard/ui/` — registry-driven `DashboardView` (responsive 6-column grid, discrete `WIDGET_SIZE_CLASS`), shared `WidgetCard`, per-widget `Suspense`/`ErrorBoundary` states, and the `DraftsWidget`. `dashboard.page.tsx` prefetches the layout.
- Coverage: `server/__tests__/layout.test.ts` (11), `server/__tests__/procedures.test.ts` (6), `__tests__/registry.test.ts` (3).
- Verified: full suite (842 tests) green, `npx tsc --noEmit` clean, scoped eslint clean, `npm run build` green.
