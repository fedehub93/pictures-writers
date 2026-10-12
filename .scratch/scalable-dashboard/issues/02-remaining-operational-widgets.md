# 02: Remaining operational widgets with filtered click-through

**What to build:** The four remaining operational widgets, each showing a count, a short list of the most relevant records, and a link to the corresponding destination list filtered by status. Where a destination list view does not yet accept its status filter from the URL, add that support so the click-through lands filtered.

**Blocked by:** 01

**Status:** resolved

- [x] Contenuti in programmazione shows upcoming scheduled content and links to the schedule view.
- [x] Recensioni da moderare shows unpublished reviews and links to the reviews list.
- [x] Ordini da completare shows pending orders and links to the orders list filtered by pending.
- [x] Automazioni in errore shows failed runs and links to the executions view filtered by failed.
- [x] Each destination list view reads its status filter from the URL query string (added where missing).
- [x] Each widget is hidden when the user lacks its area permission.

## Comments

Delivered:

- `src/modules/dashboard/server/procedures.ts` — `dashboard.getScheduled` (`posts.read`), `getPendingReviews` (`reviews.read`), `getPendingOrders` (`orders.read`), `getFailedRuns` (`automations.read`); each returns `{ count, items }` limited to the five most relevant records.
- `src/modules/dashboard/ui/` — a shared `WidgetList` body (count + short list + filtered footer link) and the `ScheduledWidget`, `PendingReviewsWidget`, `PendingOrdersWidget`, `FailedRunsWidget`; `DraftsWidget` refactored onto the same shell. Footer links carry the status filter: `/admin/schedule?status=SCHEDULED`, `/admin/shop/reviews?status=false`, `/admin/shop/orders?status=PENDING`, `/admin/automations/executions?status=FAILED`, `/admin/posts?status=DRAFT`.
- `src/modules/dashboard/registry.ts` — the four definitions registered with their area permissions and added to `DEFAULT_DASHBOARD_INSTANCES`, so `computeDashboardLayout` hides each without its permission.
- Global executions destination (agreed with the user, since only per-automation executions existed): `automations.getRuns` now accepts an optional `automationId` and returns `automationId`/`automation`; new `/admin/automations/executions` page reads `status` from the URL and lists runs across automations.
- Coverage: `dashboard/server/__tests__/procedures.test.ts` (per-procedure count/list/filters), `dashboard/__tests__/registry.test.ts` (default order + permission filtering), `automations/server/__tests__/procedures.test.ts` (global vs per-automation runs, status filter).
- Verified: full suite (850 tests) green, `npx tsc --noEmit` clean, scoped eslint clean, `npm run build` green.

Notes:

- Destination list views already read `status` from the URL (posts, reviews, orders, schedule via nuqs; executions via `loadRunSearchParams`); only the new global executions page needed to be added.
