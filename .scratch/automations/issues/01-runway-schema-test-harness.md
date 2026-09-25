# 01: Runway — schema and test harness

**What to build:** The Prisma models backing the automation feature plus a working test harness, so every later ticket lands on green. Models: `Automation` (status DRAFT/PUBLISHED, published snapshot, webhook secret hash), `Node` (type, position, data, credential reference), `Connection` (from/to node, fromOutput e.g. `main`/`true`/`false`, toInput), `AutomationRun` (trigger type, graph snapshot, payload, idempotency key, status, error), `AutomationRunStep` (ledger: input/output snapshots, status, attempts, resume time, error), `Credential` (name, type, encrypted secret). Vitest is wired to the dedicated test database (`.env.test`) with a cleanup helper, following the repo's documented convention.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Migration is generated and applies to the test database; models match the spec (status/snapshot/webhook secret on Automation; Json position/data + credential reference on Node; fromOutput/toInput + no cycles enforced later at validation, not constraint).
- [x] `npm test` runs and is green on a smoke test that imports the automation module entry point.
- [x] A reusable cleanup helper wipes all six automation tables between tests.
- [x] The schema follows the repo glossary (Automation, Node, Connection, Run, Step, Credential, Idempotency key) and respects ADR-0004 and ADR-0005 (no domain-specific fields on Run/Step).

## Comments

Delivered:

- `prisma/migrations/20260924095408_add_automation_engine` defines the six models per the spec; follow-ups `20260924101048_relax_automation_run_idempotency_key` (idempotency key non-unique on the run, per spec semantics) and `20260924120000_add_unique_connection_duplicate_guard` (duplicate-connection guard); `20260924130000_add_automations_permissions` adds the read/write keys. All apply cleanly to the test DB (`vitest` runs `prisma migrate deploy`).
- `npm test` (`vitest`) is green: `lib/__tests__/smoke.test.ts` imports the module entry point (`src/modules/automations`), round-trips an Automation (create → verify name/status DRAFT/null snapshot → findUnique) and passes. Full automations suite: 24/24.
- Cleanup helper: `lib/cleanup.ts` → `cleanupAutomationTables()`, exported from the module entry point; wipes all six tables in FK-safe order between tests, guarded to the `.env.test` database only.
- Schema glossary: `Automation`, `Node`, `Connection`, `AutomationRun`, `AutomationRunStep`, `Credential` in `prisma/schema.prisma`; Run/Step carry no domain-specific fields (ADR-0004 snapshot semantics, ADR-0005 engine stays domain-agnostic); cycle rejection is validation-time (issue 02), not a DB constraint.