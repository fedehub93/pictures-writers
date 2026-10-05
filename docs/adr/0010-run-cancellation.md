# Run cancellation is terminal, passive, and frees the idempotency key

**Status**: accepted

A backoffice user needs to stop an already-started Run (e.g. a nurture sequence for a contact who submitted a fake address) before its remaining Steps fire. We expose a `cancelRun` procedure under `automations.write` that moves a `RUNNING` Run to `CANCELED`, sets its `PENDING`/`RUNNING` Steps to `SKIPPED`, clears their `resumeAt`, records an optional `cancelReason`, and stamps `endedAt`. Cancellation is **passive**: it does not interrupt a Step already executing in another transaction — that Step may still complete its external side effect, but because the cancel and the Step-completion transaction serialize on the Run row, no downstream Step is ever created for the canceled Run (either the cancel skips the new children, or the completion finds its Step already `SKIPPED`). Because `enqueueRun` only deduplicates against non-terminal Runs, cancelling a Run **frees its idempotency key**: a later trigger with the same key starts a fresh Run. The existing 500-execution safety cancel is folded into the same code path and now records its reason in `cancelReason` rather than `error`, keeping `error` exclusive to `FAILED` Runs.

## Considered options

- **Cooperative cancellation** (a `cancelRequestedAt` flag that long-running HTTP/LLM handlers poll): rejected for the MVP — it adds a cancellation channel to every handler for a rare race, and cannot unsend an email already in flight anyway.
- **Reversible pause/resume**: rejected — the glossary already holds that a waiting Step is just a Step with a resume time; there is no paused-Run concept to build.
- **Reusing `error` for the cancellation reason**: rejected — `error` is documented as the failure reason for `FAILED` Runs and the UI renders it as a destructive "Run failed" alert.

## Consequences

- Cancelling intentionally releases the dedup key, so an identical `form.submitted` after a cancel starts a new Run. Callers that need a stronger guarantee must model it in their trigger payload.
- A Step already in flight may still produce its external effect (e.g. send an email); only its ledger write and downstream Steps are suppressed.
- The Executions UI shows a neutral "Run canceled" alert for `CANCELED` Runs and only offers cancellation while the Run is `RUNNING`.
