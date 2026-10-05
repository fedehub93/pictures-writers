# Run cancellation

Status: ready-for-agent

## Problem Statement

An Automation can sit in the `RUNNING` state for days while it sleeps on a Wait Step between nurture emails. If the reason for the sequence disappears — for example, a contact submitted a fake email address to an ebook download — the owner has no way to stop that Run, and the remaining Steps fire on schedule. The only path to the `CANCELED` status today is the engine's automatic 500-execution safety guard, which is not exposed to users and is not a deliberate action.

## Solution

An authorized backoffice user can cancel a single `RUNNING` Run, either from its Run detail page or from the Executions list. Cancelling moves the Run to `CANCELED`, skips its pending Steps, records an optional reason, and guarantees that no further Step of that Run executes. Cancellation is terminal: there is no pause and no resume. A Step already in flight may still produce its external effect (it cannot be recalled), but its ledger write and any downstream Steps are suppressed. Cancelling also frees the Run's idempotency key, so a later trigger with the same key starts a fresh Run.

## User Stories

1. As an administrator, I want to cancel a single `RUNNING` Run from its Run detail page, so that a nurture sequence I no longer want stops before its next email.
2. As an administrator, I want to cancel a `RUNNING` Run directly from the Executions list, so that I do not have to open each Run to stop it.
3. As an administrator, I want to attach an optional free-text reason when cancelling, so that I (or a colleague) can understand later why the Run was stopped.
4. As an administrator, I want the Run detail to show a distinct, neutral "Run canceled" notice with the reason, so that a cancelled Run is not confused with a failed one.
5. As an administrator, I want the Run status badge to render `CANCELED` clearly, so that I can spot cancelled Runs at a glance.
6. As an administrator, I want the cancel action to appear only while a Run is `RUNNING`, so that I cannot try to cancel an already-terminal Run.
7. As an administrator, I want a confirmation step before cancelling, so that I cannot stop a Run by a single accidental click.
8. As an administrator, I want cancelling a Run that is already terminal to be a harmless no-op, so that a double click or a stale page does not error.
9. As an administrator, I want the Executions list to reflect the new status immediately after cancelling, so that the screen is consistent without a manual refresh.
10. As an administrator with only read permission, I want the cancel action to be unavailable and the procedure to reject me, so that viewing Automations never lets me stop them.
11. As an administrator, I want a cancelled Run's pending Steps to be marked skipped, so that the step trace explains why nothing else ran.
12. As an administrator, I want a Step that was already running when I cancelled to appear completed if it finished, so that the ledger reflects reality even though no Steps followed it.
13. As an administrator, I want the automatic 500-execution cancellation to show the same neutral "Run canceled" notice with its reason, so that both kinds of cancellation look consistent.
14. As an administrator, I want a cancelled Run's idempotency key to be released, so that a new submission with the same key can start a fresh Run.
15. As an administrator, I want the Executions list to be filterable by `CANCELED`, so that I can review stopped Runs.
16. As an administrator, I want to see the cancellation reason on the Run detail, so that the record of why is preserved with the Run.
17. As a developer, I want cancellation to be one shared engine path also used by the execution-limit guard, so that the two never drift apart.
18. As a developer, I want cancelling to rely on the existing Run-row locking, so that no orphaned pending Steps can be created by a race with a Step completing.

## Implementation Decisions

### Domain vocabulary

- The entity is a **Run**; the action is **cancel** and the resulting status is `CANCELED`. "Terminate", "stop" and "abort" are avoided (glossary: `CONTEXT.md` → "Run cancellation"; see also ADR-0010). There is no paused Run.

### Data model

- Add a nullable `cancelReason` string to `AutomationRun` (migration required). No new status value: `CANCELED` already exists.
- `error` remains exclusive to `FAILED` Runs. The 500-execution safety guard stops writing to `error` and records its message in `cancelReason` instead.

### Engine

- Add one exported engine function, `cancelAutomationRun({ runId, reason })`, that within a transaction: locks the Run row; sets its `PENDING` and `RUNNING` Steps to `SKIPPED`, clearing `resumeAt`, lease id and lease expiry; sets the Run to `CANCELED` with `cancelReason` (optional, `null` when absent) and `endedAt`. It is a no-op when the Run is not `RUNNING`.
- The execution-limit guard is refactored to call this same function, passing the limit message as the reason.
- No cooperative-cancellation flag and no other runner change: the existing `lockRun` (`SELECT … FOR UPDATE`) serialises a completion against a cancellation. Whichever wins the lock, a Step created for a cancelled Run is skipped, and a Step whose completion loses the race finds itself already `SKIPPED` and creates no child. Cancelling therefore cannot leave orphaned pending Steps.

### API

- One tRPC mutation, `cancelRun`, gated by `automations.write`.
  - Input: `{ automationId: string; id: string; reason?: string }`, scoped by `automationId` exactly like `getRun`, to prevent cancelling a Run of another Automation.
  - `NOT_FOUND` when the Run does not exist or does not belong to the Automation.
  - `reason` is trimmed; empty becomes absent; capped at 500 characters.
  - When the Run is already terminal, the mutation returns the Run's current state without error (idempotent).
  - Returns the Run's identity and outcome: `id`, `automationId`, `status`, `cancelReason`, `endedAt`.
- `getRun` and `getRuns` select and return `cancelReason`.
- No REST route or webhook: cancellation is admin-only and synchronous.

### UI (admin, Executions)

- A `CancelRunDialog` built on the shared `ResponsiveDialog` (dialog on desktop, drawer on mobile), containing an optional reason textarea and a destructive confirm button.
- Run detail: a "Cancel run" button in the header, shown only while the Run is `RUNNING`; a neutral "Run canceled" notice showing `cancelReason` when present (the destructive "Run failed" notice remains only for `FAILED`).
- Executions list: the row action becomes an "Actions" dropdown; it always offers View (Debug when `FAILED`) and additionally offers "Cancel run" only while the Run is `RUNNING`.
- The status badge needs no change; it already renders `CANCELED`.
- After a successful cancel, invalidate the Run detail and Executions list queries and show a success toast.

## Testing Decisions

- A good test asserts external, observable behaviour of the engine against the Vitest test database — the Run and Step ledger states and whether a subsequent Step executes — never internal helper details.
- Seam: the existing runner/ingestion seam, added to as a new `cancel-run` test module beside the current engine suite. The repo has no component tests and no procedure-level tests, so the UI and the tRPC procedure are covered by `npm run lint` / `npm run build` plus manual verification, consistent with the automation engine spec.
- Cover: cancelling a Run sleeping on a Wait Step prevents the next Step from executing; a cancel racing an in-flight Step leaves no orphaned pending Step and suppresses downstream Steps; cancelling a terminal Run is a no-op; the reason is persisted; the idempotency key is released so an identical trigger starts a new Run; the execution-limit guard records `cancelReason` and leaves `error` null.
- Prior art: `lib/__tests__/automation-engine.test.ts` and `lib/__tests__/run-ledger.test.ts`.

## Out of Scope

- Disabling or pausing an Automation so that no new Runs start.
- Bulk cancellation of all running Runs.
- Cooperative interruption of an in-flight handler.
- Reversible pause/resume of a Run.
- A REST endpoint or webhook for cancellation.
- Recording which backoffice user cancelled a Run (only the optional reason is stored; no audit trail in this module).
- Any change to the Executions list's existing performance follow-up (heavy `getRun` payloads).

## Further Notes

- Motivating case: an ebook-download Automation sends a nurture sequence; the address submitted was fake, so the Run should stop.
- Domain docs updated with this work: `CONTEXT.md` ("Run cancellation") and `docs/adr/0010-run-cancellation.md`.
- The idempotency-key release is intentional and records why a cancelled trigger may legitimately start a new Run.
