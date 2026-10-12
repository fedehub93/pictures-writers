# 05: Remaining metrics (form submissions, ebook downloads, revenue)

**What to build:** The three remaining metrics, so the Trend widget can chart form submissions, ebook downloads, and revenue/orders. The ebook download metric folds the existing REST stats logic into the tRPC metric registry, giving the dashboard one data convention. The default layout seeds a Trend instance for each new metric.

**Blocked by:** 04

**Status:** resolved

- [x] Form submissions metric (`submissions.read`) buckets submissions over the selected range.
- [x] Download ebook metric (`dashboard.read`) wraps the existing ebook download stats, migrated from the REST endpoint to a tRPC procedure.
- [x] Ricavi / ordini metric (`orders.read`) aggregates order totals over the selected range.
- [x] The default layout seeds one Trend instance per new metric.
- [x] Each metric's time-series function is tested for period bucketing and permission scoping.

## Comments

Delivered:

- `src/modules/dashboard/server/metrics/series.ts` — shared range bucketing: `monthlyBuckets(from, to)` returns one calendar-month bucket per month, clamped to the range so the buckets partition it exactly (labels gain the year when the range crosses a year boundary, so long ranges stay unambiguous); `growthPercentage(current, previous)`; `buildRangeSeries(from, to, aggregate)`, which produces the month points, the range total, and the growth against the previous comparable period; and `seriesFromGrowthStats(stats)`, the shared mapping of the wrapped contact/ebook growth stats onto a Metric series. The aggregation is injected, so each metric decides what it counts or sums and the helper is unit-testable without a database.
- `src/modules/dashboard/server/metrics/submissions.ts` — `submissions` metric (`submissions.read`) counting `FormSubmission.createdAt` per month over the range via `buildRangeSeries`.
- `src/modules/dashboard/server/metrics/ebooks.ts` — `ebooks` metric (`dashboard.read`) wrapping `getEbookDownloadGrowth` (the former `/api/ebooks/stats` logic): the range drives total and growth, the buckets are that query's trailing six months, exactly as the contacts metric reuses its growth query.
- `src/modules/dashboard/server/metrics/contacts.ts` — refactored onto the shared `seriesFromGrowthStats` mapping (no behaviour change), removing the duplicated stats-to-series code the ebook metric would otherwise have copied.
- `src/modules/dashboard/server/metrics/revenue.ts` — `revenue` metric (`orders.read`) summing `Order.totalAmount` of completed orders by their completion moment (`completedAt`), per month over the range. Per the domain (CONTEXT.md, "Order completion"), completion is the canonical business moment for analytics, so draft, pending, and cancelled orders are excluded.
- `src/modules/dashboard/server/metrics/registry.ts` — registers the three metrics after contacts, in the spec's order.
- `src/modules/dashboard/registry.ts` — seeds `trend-submissions`, `trend-ebooks`, and `trend-revenue` Trend instances after `trend-contacts`; the existing view renders them and drops any whose metric the user may not read.
- Removed the now-dead REST convention: `src/app/api/ebooks/stats/route.ts`, `src/app/(admin)/_hooks/use-ebook-stats-query.ts`, and `src/app/(admin)/admin/(routes)/dashboard/_components/ebooks-widget.tsx` (the orphaned pre-registry widget). The dashboard reads ebook stats only through tRPC now.
- Coverage: `server/metrics/__tests__/series.test.ts` (10: bucket count, clamping, single-month, inverted range, year-spanning labels, growth, series assembly, growth-stats mapping), `submissions.test.ts` (3), `ebooks.test.ts` (3), `revenue.test.ts` (3), plus updates to `server/metrics/__tests__/registry.test.ts` (metric ids + per-metric permissions + filtering), `__tests__/registry.test.ts` (seeded defaults and computed layout), and `server/__tests__/procedures.test.ts` (`getMetrics` scoping for the new metrics). Metric tests anchor to a far-future period so the global counts stay deterministic against the shared test database.
- Verified: full suite (900 tests) green, `npx tsc --noEmit` clean, scoped eslint clean, `npm run build` green.

Notes:

- The Trend widget needed no new UI; it already renders exactly one metric from the registry, so the three metrics appear with no component changes.
- The orphaned `EbooksWidget` was the only consumer of the deleted `use-ebook-stats-query` hook, so removing the hook required removing the widget too; both were unreachable before the change.
