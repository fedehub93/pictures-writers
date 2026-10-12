# 05: Remaining metrics (form submissions, ebook downloads, revenue)

**What to build:** The three remaining metrics, so the Trend widget can chart form submissions, ebook downloads, and revenue/orders. The ebook download metric folds the existing REST stats logic into the tRPC metric registry, giving the dashboard one data convention. The default layout seeds a Trend instance for each new metric.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] Form submissions metric (`submissions.read`) buckets submissions over the selected range.
- [ ] Download ebook metric (`dashboard.read`) wraps the existing ebook download stats, migrated from the REST endpoint to a tRPC procedure.
- [ ] Ricavi / ordini metric (`orders.read`) aggregates order totals over the selected range.
- [ ] The default layout seeds one Trend instance per new metric.
- [ ] Each metric's time-series function is tested for period bucketing and permission scoping.
