# 01: Runway — schema and test harness

**What to build:** The Prisma models backing the automation feature plus a working test harness, so every later ticket lands on green. Models: `Automation` (status DRAFT/PUBLISHED, published snapshot, webhook secret hash), `Node` (type, position, data, credential reference), `Connection` (from/to node, fromOutput e.g. `main`/`true`/`false`, toInput), `AutomationRun` (trigger type, graph snapshot, payload, idempotency key, status, error), `AutomationRunStep` (ledger: input/output snapshots, status, attempts, resume time, error), `Credential` (name, type, encrypted secret). Vitest is wired to the dedicated test database (`.env.test`) with a cleanup helper, following the repo's documented convention.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Migration is generated and applies to the test database; models match the spec (status/snapshot/webhook secret on Automation; Json position/data + credential reference on Node; fromOutput/toInput + no cycles enforced later at validation, not constraint).
- [ ] `npm test` runs and is green on a smoke test that imports the automation module entry point.
- [ ] A reusable cleanup helper wipes all six automation tables between tests.
- [ ] The schema follows the repo glossary (Automation, Node, Connection, Run, Step, Credential, Idempotency key) and respects ADR-0004 and ADR-0005 (no domain-specific fields on Run/Step).