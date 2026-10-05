# 01: Cancel a Run from its detail page

**What to build:** A backoffice user with `automations.write` can cancel a single `RUNNING` Run from its Run detail page. Cancelling moves the Run to `CANCELED`, skips its pending Steps, optionally records a reason, and guarantees no further Step of that Run executes. The Run detail shows a neutral "Run canceled" notice with the reason; the destructive "Run failed" notice stays exclusive to `FAILED` Runs. The same engine path is used by the execution-limit guard, which now records its reason in `cancelReason` instead of `error`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] `AutomationRun` gains a nullable `cancelReason` column via migration; `CANCELED` is reused (no new status).
- [ ] An exported engine function `cancelAutomationRun({ runId, reason })` locks the Run, sets its `PENDING`/`RUNNING` Steps to `SKIPPED` (clearing `resumeAt` and lease), sets the Run to `CANCELED` with `cancelReason` and `endedAt`, and is a no-op when the Run is not `RUNNING`.
- [ ] The 500-execution safety guard calls the same function and records its message in `cancelReason`, leaving `error` null.
- [ ] A `cancelRun` tRPC mutation gated by `automations.write` accepts `{ automationId, id, reason? }`, scopes by `automationId` (like `getRun`), returns `NOT_FOUND` for a missing or foreign Run, trims the reason (empty becomes absent, max 500 chars), and returns the Run's current state as an idempotent no-op when the Run is already terminal.
- [ ] `getRun` and `getRuns` return `cancelReason`.
- [ ] The Run detail header offers a "Cancel run" action only while the Run is `RUNNING`, opening a `ResponsiveDialog`-based confirmation with an optional reason textarea and a destructive confirm.
- [ ] After a successful cancel, the Run detail and Executions list queries are invalidated and a success toast is shown.
- [ ] A neutral "Run canceled" notice shows the reason on the Run detail; the destructive "Run failed" notice appears only for `FAILED` Runs.
- [ ] Behaviour is covered by a new `cancel-run` test module on the runner/test-DB seam: a Run sleeping on a Wait Step does not execute its next Step after cancel; a cancel racing an in-flight Step leaves no orphaned pending Step and suppresses downstream Steps; cancelling a terminal Run is a no-op; the reason is persisted; the idempotency key is released so an identical trigger starts a new Run; the execution-limit guard records `cancelReason`.
- [ ] `npm run lint` and `npm run build` pass.
