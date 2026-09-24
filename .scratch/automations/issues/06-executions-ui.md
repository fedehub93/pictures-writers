# 06: Executions UI — runs list and step trace

**What to build:** The debugger for automations. Per Automation, an Executions screen listing every Run (status, trigger type, dates, error) with filters, and a Run detail showing the ordered Step trace: node, status, attempt count, input/output snapshots, and error. This is the surface that makes a nurture flow auditable day 1 → day 3 → day 5.

**Blocked by:** 02, 05

**Status:** ready-for-agent

- [ ] Executions screen lists runs for an Automation with status and date filters; failures are visually distinct.
- [ ] Run detail shows every Step in order (node, status, attempts, input/output, error), truncating oversized snapshots as the engine caps them.
- [ ] Data comes from the ledger via the automations router queries; the screens live in the automations module's admin views.
- [ ] Fields use the repo vocabulary (Run, Step, snapshot) per the glossary.