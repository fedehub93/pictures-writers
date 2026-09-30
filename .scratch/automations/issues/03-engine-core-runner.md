# 03: Engine core — ingestion, ledger, linear runner, wait node, cron pump

**What to build:** The generic runtime for durable automation execution. A single ingestion point, `enqueueRun`, resolves the published snapshot, stores the graph snapshot on the run, and creates the initial pending steps. The runner is pumped by a cron endpoint with secret-header auth; it claims due steps with lease-based locking, executes each node through the registry, writes the step ledger, and marks the run as terminal when no work remains due. The wait node sets `resumeAt` so the run sleeps as rows and resumes later. Transient failures retry with bounded attempts and backoff. This is implemented as a DB-backed worker pattern, not an in-memory loop.

**Blocked by:** 01

**Status:** completed

- [x] `enqueueRun` creates a run with a frozen graph snapshot and deduplicates active runs; automated triggers are no-ops for unpublished automations.
- [x] The pump route authenticates via the secret header; the runner claims and executes due steps using lease-based locking and writes the ledger (PENDING → RUNNING → COMPLETED/FAILED/WAITING with attempts, `resumeAt`, and error).
- [x] A chain `trigger → wait → end` completes a run across pumps: wait sets `resumeAt`, the runner skips it until due, then advances and finalizes the run.
- [x] Transient failures are retried with bounded attempts/backoff; failed steps and failed runs reflect final state correctly.
- [x] Integration tests cover ingestion, resume, retry, lease reclaim, and effect-based execution using the injected `now` clock and in-memory effects seam.

**Implementation notes:**
- The real runtime logic lives in the runner: it finds due steps, claims them safely, calls the node handler, and decides whether to succeed, wait, retry, or fail.
- The run and step ledger are persisted in the database so execution is resumable and safe across crashes or multiple workers.
- The published snapshot is immutable per run, so later draft edits do not mutate currently running automations.
- Verified with the automation engine tests and TypeScript/Vitest validation.