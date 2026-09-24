# 03: Engine core — ingestion, ledger, linear runner, wait node, cron pump

**What to build:** The generic runtime. A single ingestion point `enqueueRun(automation, triggerType, payload, idempotencyKey?)` that resolves the published snapshot, stores the graph on the Run (so later republishes cannot corrupt a live run), and creates the first pending Steps. A runner — pumped by a new cron endpoint mirroring the existing scheduler route and its secret-header auth — claims due Steps (`FOR UPDATE SKIP LOCKED` leases), executes each via the node registry, writes the Step ledger, and marks the Run terminal when nothing is left due. The Wait node sets `resumeAt` so a run "sleeps" as rows and resumes later. Transient failures retry (3 attempts, 5 min backoff, mirroring the scheduler handler pattern).

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] `enqueueRun` creates a Run with a graph snapshot and terminal logic; automated triggers are no-ops for unpublished Automations.
- [ ] The pump route authenticates via the secret header; the runner claims and executes due Steps with leases and writes the ledger (PENDING → RUNNING → COMPLETED/FAILED with attempts and error).
- [ ] A chain `trigger → wait → (end)` completes a Run across pumps: wait sets resumeAt, the runner skips it until due, then finishes the Run.
- [ ] Transient failures are retried with bounded attempts/backoff; the Step and Run reflect final failure.
- [ ] Integration tests cover ingestion, resume, and retry using the injected `now` clock and an in-memory effects context (the seam defined by the engine).