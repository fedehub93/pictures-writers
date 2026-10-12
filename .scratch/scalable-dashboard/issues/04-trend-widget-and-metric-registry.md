# 04: Trend widget, metric registry and analytics date range

**What to build:** Analytics are delivered by a single generic Trend widget driven by a server-side metric registry, rather than one widget per metric. A shared date range governs only the analytics widgets; operational widgets are always "now" and ignore it. The default layout seeds a Trend instance for the first metric, Iscritti / contatti, which reuses the existing contact growth query.

**Blocked by:** 01

**Status:** resolved

- [x] A server-side metric registry exposes metrics of shape id, label, permission, and a time-series function over a date range.
- [x] The Trend widget renders exactly one metric and hides itself when the user can read none of the available metrics.
- [x] A shared date range control is reused and governs only analytics widgets; operational widgets ignore it.
- [x] The default layout seeds a Trend instance for the first metric (Iscritti / contatti).
- [x] The Iscritti / contatti metric reuses the existing contact growth query and respects `contacts.read`.
- [x] Metrics are permission-scoped and covered by tests.

## Comments

Delivered:

- `src/modules/dashboard/types.ts` — `Metric`, `MetricSeries`, `MetricPoint`, `MetricSummary`, and a `WidgetCategory` (`operational` | `analytics`) added to `WidgetDefinition` so the view can tell the two fascia apart.
- `src/modules/dashboard/server/metrics/` — the server-side metric registry (`registry.ts`: `METRICS`, `getMetric`, `permittedMetrics`) and the first metric (`contacts.ts`), which reuses `getEmailContactsGrowth` and is gated by `contacts.read`.
- `src/modules/dashboard/server/procedures.ts` — `dashboard.getMetrics` (the metrics the user may read) and `dashboard.getMetricSeries` (`{ metricId, from, to }`), both behind `dashboard.read` and the latter additionally enforcing the metric's own permission. Shared `requireUser` helper.
- `src/modules/dashboard/lib/metric-selection.ts` — pure `resolveMetric` (configured metric only when permitted, else the first permitted for a config-less instance; `null` when none) and `isAnalyticsInstanceRenderable`.
- `src/modules/dashboard/ui/widgets/trend-widget.tsx` — the generic Trend: renders exactly one metric, hides itself when none, and subscribes to the shared `useDateRangeStore`.
- `src/modules/dashboard/registry.ts` — the `trend` definition (`category: "analytics"`, no definition permission) and the seeded `trend-contacts` default instance; `isAnalyticsWidget` helper.
- `src/modules/dashboard/ui/views/dashboard-view.tsx` — fetches the permitted metrics, drops analytics instances with no renderable metric, filters the library, and renders the shared `DatePickerWithRange` as the analytics range (operational widgets never read it). `page.tsx` prefetches the metrics.
- Coverage: `server/metrics/__tests__/registry.test.ts` (5), `server/metrics/__tests__/contacts.test.ts` (2), `lib/__tests__/metric-selection.test.ts` (4), plus updates to `__tests__/registry.test.ts` and `server/__tests__/procedures.test.ts` (metric procedures' permission scoping).
- Verified: full suite (879 tests) green, `npx tsc --noEmit` clean, scoped eslint clean, `npm run build` green.

Notes:

- The contact metric intentionally reuses `getEmailContactsGrowth`, so its buckets remain that query's trailing-six-month series while the range drives the total/growth — the reuse the ticket asks for. Ticket 05's new aggregations bucket over the requested range.
- The Trend's availability is not expressed as a definition permission (it derives from the metrics a user may read); the layout merge keeps it and the view/Trend drop it when no metric is renderable.

