# In-house DB-backed run engine instead of a workflow vendor

**Status**: accepted

Automations need durable multi-step execution with multi-day waits (nurture emails), retries, and idempotent runs. We build the runtime in-house on the existing scheduler pattern (`ScheduledAction`: lease claim with `FOR UPDATE SKIP LOCKED`, retry with backoff, idempotency, external cron endpoint) instead of adopting Inngest, extending it into an `AutomationRun`/`AutomationRunStep` ledger. A wait between nodes is a `resumeAt` on the Step record, so a run "sleeps" as a row and is durably resumable across process restarts — consistent with the project's "fewer external integrations" philosophy.

## Considered options

- **Inngest cloud**: proven runtime durability, but a vendor, a network hop between trigger and first node, and contradicts the goal of not growing external dependencies.
- **Inngest self-hosted**: OSS core + Postgres state store + a long-lived instance to operate, upgrade and monitor; buys reliability headroom our volume (tens to hundreds of runs/day) does not need.
- **External cron endpoint (cron-job.org, already in use)**: retained as the pump for `/api/automations/run`, mirroring `/api/scheduler/run`.

## Consequences

- We own retries, leases and concurrency correctness, but the primitives already exist in the scheduler module.
- The node abstraction (config + data in → data out) maps 1:1 to Inngest step functions, so migrating the execution layer later does not touch the editor or node definitions.