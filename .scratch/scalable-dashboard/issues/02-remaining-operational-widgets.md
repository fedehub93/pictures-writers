# 02: Remaining operational widgets with filtered click-through

**What to build:** The four remaining operational widgets, each showing a count, a short list of the most relevant records, and a link to the corresponding destination list filtered by status. Where a destination list view does not yet accept its status filter from the URL, add that support so the click-through lands filtered.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Contenuti in programmazione shows upcoming scheduled content and links to the schedule view.
- [ ] Recensioni da moderare shows unpublished reviews and links to the reviews list.
- [ ] Ordini da completare shows pending orders and links to the orders list filtered by pending.
- [ ] Automazioni in errore shows failed runs and links to the executions view filtered by failed.
- [ ] Each destination list view reads its status filter from the URL query string (added where missing).
- [ ] Each widget is hidden when the user lacks its area permission.
