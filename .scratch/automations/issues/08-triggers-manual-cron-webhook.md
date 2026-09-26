# 08: Triggers — manual (run now), cron, webhook

**What to build:** The three general trigger types. "Run now" from the editor (or list) enqueues a Run manually with an empty or editor-provided payload. A cron trigger fires when the interval defined on the trigger node has elapsed since the most recent Run of that Automation (read from the ledger). A webhook trigger exposes an authenticated route: a constant-time comparison of a caller secret against the Automation's stored hash starts a Run with the request body as payload.

**Blocked by:** 02, 05

**Status:** resolved

- [x] "Run now" starts a Run from the admin with an explanatory payload; it works even while the Automation is published.
- [x] A cron-triggered Automation fires on interval based on the ledger's most recent Run (clock injected for deterministic tests); unpublished Automations never fire.
- [x] The webhook route authenticates the caller secret in constant time against the stored hash and creates a Run whose payload is the request body; bad/missing secrets are rejected.
- [x] Each trigger type is covered by ingestion tests through the pump/runner.

## Comments

Delivered:

- **Manual ("Run now").** `automations.execute` now accepts an optional editor payload and defaults to an explanatory `{ source: "manual", triggeredAt }` snapshot, returning `{ id, name, runId }`. `enqueueRun` is unchanged: manual runs work for published Automations (the editor's Execute button still appears only when a `MANUAL_TRIGGER` node exists).
- **Cron.** `lib/cron-schedule.ts` carries the pure schedule (`parseCronSchedule`, `parseTimeOfDay`, `nextCronFireAt`, `isCronTriggerDue`) — interval as ms/human string/unit object plus optional UTC `timeOfDay`; the previous `duration` helpers moved to `lib/duration.ts` and are shared with the Wait node. `lib/automation-triggers.ts` exposes `enqueueDueCronAutomations({ now })`, which reads the most recent Run per published Automation from the ledger and enqueues through the single ingestion point. It runs at the top of `/api/automations/run` before the step pump. Unpublished Automations are filtered out.
- **Webhook.** `lib/webhook-secret.ts` hashes the secret (`sha256` hex) and verifies a caller secret in constant time (`timingSafeEqual`), rejecting malformed stored hashes. `enqueueWebhookRun` verifies then enqueues with the request body as payload. The route `src/app/api/automations/webhook/[automationId]/route.ts` reads `x-automation-secret`, returns 401 for bad/missing secrets, and 200 `{ runId }` otherwise (`runId: null` when unpublished). No automation existence is leaked (unknown id and bad secret are both 401).
- **Admin secret management.** `setWebhookSecret` / `clearWebhookSecret` procedures store only the hash; `getOne` strips `webhookSecretHash` and exposes `hasWebhookSecret`. UI: `CRON_TRIGGER`/`WEBHOOK_TRIGGER` palette entries, a `TriggerNode` canvas renderer, and shadcn `Field` config panels (cron interval + time of day; webhook status, endpoint with copy, secret with generate/save/remove). `TRIGGER_NODE_TYPES` now lists all three so cron/webhook-only graphs publish.
- **Tests.** `cron-schedule` and `webhook-secret` unit suites; `automation-triggers` integration covers manual, cron (due/not-due/unpublished, through the pump), webhook accept/reject/ignored (through the pump); the webhook route suite covers 401/200/500 and body parsing. `validate` now asserts cron/webhook count as triggers.
- **Draining pump.** `server/automation-runtime.ts` composes the concrete registry/effects and `pumpDueAutomations` calls the runner repeatedly until nothing is due (bounded). Because `runDueAutomations` snapshots the due set, a chain previously advanced one node per cron tick; now one tick — and "Run now" — drains a whole chain up to its first wait/retry. `execute` enqueues then drains synchronously, so a manual test actually runs. The cron endpoint keeps its own registry/effect wiring out of the engine core (ADR-0003).
- Verified: `npx tsc --noEmit` clean; full `npm run test:run` 448/448 (57 files); `npx eslint` clean on touched paths; `npm run build` succeeds.

## Deployment note

The external cron (cron-job.org) must POST `/api/automations/run/` with the `x-scheduled-publication-secret` header, in addition to the existing `/api/scheduler/run/`. Without it, cron/webhook-triggered runs stay enqueued until a manual "Run now" drains them.

Non-blocking follow-ups:

- The webhook endpoint path is shown relative; the panel copies `window.location.origin + path` on demand.
- Multiple cron triggers on one Automation share the Automation's most recent Run as their interval base (all fire together when any is due).