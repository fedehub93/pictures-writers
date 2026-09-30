# 06: Executions UI — runs list and step trace

**What to build:** The debugger for automations. Per Automation, an Executions screen listing every Run (status, trigger type, dates, error) with filters, and a Run detail showing the ordered Step trace: node, status, attempt count, input/output snapshots, and error. This is the surface that makes a nurture flow auditable day 1 → day 3 → day 5.

**Blocked by:** 02, 05

**Status:** resolved

- [x] Executions screen lists runs for an Automation with status and date filters; failures are visually distinct.
- [x] Run detail shows every Step in order (node, status, attempts, input/output, error), truncating oversized snapshots as the engine caps them.
- [x] Data comes from the ledger via the automations router queries; the screens live in the automations module's admin views.
- [x] Fields use the repo vocabulary (Run, Step, snapshot) per the glossary.

## Comments

Delivered (see `src/modules/automations/executions/` and `src/modules/automations/lib/run-ledger.ts`):

- Data: `automations.getRuns` (paginated Runs of one Automation, filtered by `status` and inclusive `from`/`to` on `startedAt`) and `automations.getRun` (one Run, scoped by `automationId`, with its Steps ordered by `seq`, each Step enriched with the `nodeType`/`nodeName` resolved from the Run's frozen graph snapshot; an authored node `data.label`/`data.name` wins over the type). Both live in `server/procedures.ts` under `AUTOMATIONS_READ`; `idempotencyKey` is not exposed to the UI.
- UI: `executions/ui/views/executions-view.tsx` (table of Runs with status/trigger/dates/duration/error, pagination) and `executions/ui/views/run-view.tsx` (Run details + step trace). Failed Runs get a `destructive` status badge, a tinted row, and a Debug action; errors surface in an `Alert`.
- Filters: `ExecutionsFilters` (status `CommandSelect` + From/To date inputs) via nuqs; clearing resets all filters. Date-only strings are expanded to whole UTC days by `parseRunDateRange`.
- Snapshots: the engine's `capJsonValue` shape (`{ truncated: true, value }`) is detected by `isTruncatedSnapshot` and shown with a "Truncated by engine" badge; oversized snapshots render only the retained prefix.
- Routes: `/admin/automations/[automationId]/executions` and `.../executions/[runId]`, gated by `requirePermission(AUTOMATIONS_READ)`; the editor header links to the Executions screen.
- Verified: `npx tsc --noEmit` clean; `npx eslint` 0 errors on touched paths (2 pre-existing `<img>` warnings); `vitest` 70/70 on the automations + automations API suites; full `npm run test:run` 392/392 (47 files); `npm run build` passes.
- Tests: `lib/__tests__/run-ledger.test.ts` covers node-label resolution (including authored labels and malformed-graph tolerance), snapshot truncation detection/formatting, date-range parsing and duration formatting (the repo's Seam-2 pure-function style; no component tests per the spec's testing decisions).
- Non-blocking follow-ups: `getRun` returns each Step's `input`/`output` inline, so a Run with very many large Steps can make one heavy payload — cursor/streaming could be added if runs grow. The screen and its components keep the spec's "Executions" naming for the surface while the entity-level copy uses the glossary's Run/Step/snapshot vocabulary.
