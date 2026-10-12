# 04: Trend widget, metric registry and analytics date range

**What to build:** Analytics are delivered by a single generic Trend widget driven by a server-side metric registry, rather than one widget per metric. A shared date range governs only the analytics widgets; operational widgets are always "now" and ignore it. The default layout seeds a Trend instance for the first metric, Iscritti / contatti, which reuses the existing contact growth query.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] A server-side metric registry exposes metrics of shape id, label, permission, and a time-series function over a date range.
- [ ] The Trend widget renders exactly one metric and hides itself when the user can read none of the available metrics.
- [ ] A shared date range control is reused and governs only analytics widgets; operational widgets ignore it.
- [ ] The default layout seeds a Trend instance for the first metric (Iscritti / contatti).
- [ ] The Iscritti / contatti metric reuses the existing contact growth query and respects `contacts.read`.
- [ ] Metrics are permission-scoped and covered by tests.
