# Automation engine spec

Status: ready-for-agent

## Problem Statement

The CMS grows a new feature **Automations**: an N8N-style visual workflow editor and runtime that lets the owner automate CMS-internal behaviour (form submission → nurture emails over several days, scheduled article idea research → draft creation, …) and behaviour "of any other nature" (HTTP, LLM, web search) — without relying on a growing list of external point integrations.

The initial real need came from two cases: (1) automated, possibly scheduled nurture emails to new contacts based on the (dynamic) form they submit; (2) automated web research for article ideas, drafting, and scheduled publishing.

## Solution

An in-house, domain-agnostic automation engine integrated into the admin:

- **Authoring**: a visual canvas editor (React Flow) where the owner composes an Automation out of Nodes joined by Connections. Drafts are published as an immutable snapshot; only published Automations fire.
- **Runtime**: a DB-backed runner (reusing the existing `ScheduledAction` lease/retry/idempotency/cron-endpoint pattern). Triggers enqueue a Run through a single ingestion point; a cron-pumped worker executes nodes, writes a per-Run/per-Step ledger, resumes waiting steps (`resumeAt`), and retries transient failures.
- **Catalogue (MVP)**: triggers Manual, Cron, Webhook, internal trigger event (`form.submitted`); actions Conditional, Wait, HTTP Request, Web Search, LLM, and one domain action — Send Email — registered by the mails module.
- **Visibility**: an Executions screen per Automation listing every Run with success/failure and a step trace; dedup between runs is handled by an opaque idempotency key chosen by the caller, keeping the engine free of domain concepts.

## User Stories

1. As an admin, I want to build an Automation visually on a canvas (nodes connected by arrows), so that I can compose a flow without writing code.
2. As an admin, I want a palette of triggers (manual, cron, webhook, form submitted), so that an Automation can start from the moment I choose.
3. As an admin, I want to trigger an Automation by hand ("Run now"), so that I can test a flow immediately.
4. As an admin, I want a scheduled/cron trigger, so that recurring automations (e.g. weekly research) run without me.
5. As an admin, I want a webhook trigger with a secret, so that external systems can start an Automation.
6. As an admin, I want the internal event `form.submitted` as a trigger, so that a form submission starts a nurture flow with that contact's data.
7. As an admin, I want to send an email to the contact who just submitted (or to any recipient), so that nurture works; the mail must be authored once (template + subject + interpolated fields).
8. As an admin, I want a Wait/delay node, so that emails days apart (day 1, day 3, day 5) are sent on schedule while the run "sleeps".
9. As an admin, I want a Conditional node that picks its output ("true"/"false") based on the form data or previous step output, so that different answers get different follow-ups.
10. As an admin, I want an HTTP Request node, so that I can call any external API from a flow.
11. As an admin, I want a Web Search node, so that a flow can research article topics or facts.
12. As an admin, I want an LLM node (provider + model + templated prompt), so that a flow can summarize research, write drafts, or classify input.
13. As an admin, I want node outputs to feed later nodes via connections AND to be referenced inside node configuration with template expressions (e.g. the form's answer inside the email body), so that flows stay dynamic.
14. As an admin, I want to see every Run of an Automation, their status (completed/failed/canceled) and a per-step trace with inputs, outputs and errors, so that I can debug a nurture flow after the fact.
15. As an admin, I want transient failures to retry automatically (bounded), so that a temporary provider error does not kill a flow.
16. As an admin, I want an Automation in a draft to be editable without affecting running executions, so that I can iterate safely; only published versions fire.
17. As an admin, I want a "duplicate submit must not double-send" guarantee (the same contact submitting twice must not start a second nurture cycle while one is running), handled by the forms module via an idempotency key.
18. As an admin, I want to store API keys (LLM, web search, HTTP, webhook secrets) as reusable encrypted Credentials referenced by nodes, so that secrets never sit in node configuration.
19. As an admin with restricted permissions, I want Automations gated by the usual read/write permissions, so that roles keep working.
20. As a developer, I want the engine to be generic (no knowledge of contacts, emails, or forms) and extensible via a per-module node registry, so that new triggers/actions are added without touching the engine.

## Implementation Decisions

### Data model (relational; naming per CONTEXT.md)

- `Automation` — `id`, `name`, `status` (`DRAFT`/`PUBLISHED`), `publishedSnapshot` (frozen graph), `webhookSecretHash?`, timestamps.
- `Node` — `id`, `automationId`, `type`, `name`, `position` (Json), `data` (Json — node config, may contain template expressions), `credentialId?`.
- `Connection` — `id`, `automationId`, `fromNodeId`, `toNodeId`, `fromOutput` (default `main`; the Conditional node uses `true`/`false`), `toInput` (default `main`).
- `AutomationRun` — `id`, `automationId`, `triggerType`, `graph` (the published snapshot captured at trigger time, so later republishes cannot mutate a live run), `payload` (trigger input snapshot), `idempotencyKey?`, `status` (`RUNNING`/`COMPLETED`/`FAILED`/`CANCELED`), `startedAt`, `endedAt`, `error`.
- `AutomationRunStep` — `id`, `runId`, `nodeId`, `seq`, `input` (the token received along a connection), `output`, `status` (`PENDING`/`RUNNING`/`COMPLETED`/`FAILED`/`SKIPPED`), `attempts`, `resumeAt?`, `startedAt`, `endedAt`, `error`.
- `Credential` — `id`, `name`, `type`, `secretEncrypted` (AES, key from env). Nodes reference a `credentialId`; secrets never appear in `Node.data` or run snapshots.

### Engine

- **Single ingestion point**: `enqueueRun({ automationId, triggerType, payload, idempotencyKey? })`. Called by internal events (typed emitter in the engine), by the webhook route, by the cron evaluator, and by "Run now". If the Automation is not published, ingestion is a no-op for automated triggers.
- **Idempotency/dedup**: the engine skips enqueue when a non-terminal Run exists with the same `(automationId, idempotencyKey)`. The key is an opaque string chosen by the caller (forms module decides its meaning, e.g. the contact id); the engine never interprets it (see ADR-0005).
- **Execution**: a cron-pumped `/api/automations/run` endpoint (same secret-header pattern as `/api/scheduler/run`) runs `runDueAutomations()`: claim due Steps/next-fires with `FOR UPDATE SKIP LOCKED` leases, execute the node handler, write the ledger, create downstream Steps for every outgoing Connection (fan-out, per-token: a node with two incoming Connections produces a Step per arriving token).
- **Waits**: a Wait node leaves the Step untouched with `resumeAt = now + delay`; the pump skips it until due. A run "sleeps" as rows — durable across restarts.
- **Retries**: transient failures are retried (default 3 attempts, backoff 5 min, mirroring the scheduler). Node handlers report transient vs permanent errors. Email sends are idempotent per `(runId, stepId)` using the existing idempotency-key pattern and are audited via `EmailSendLog`.
- **Guards**: cycles are rejected at validation; a run is canceled when it exceeds a max of 500 node executions.
- **Snapshots**: node inputs/outputs are capped (~64 KB each) to keep the ledger lean.
- **Cron trigger**: fires when the interval defined on the trigger node has elapsed since the most recent Run of that Automation (read from the ledger). Field on trigger data: interval + optional time-of-day.

### Node catalogue (MVP)

- **Triggers**: `manual` (Run now), `cron`, `webhook` (route `/api/automations/webhook/:automationId`, constant-time compare of `x-automation-secret` against `webhookSecretHash`), internal trigger event `form.submitted` (registered by the forms module, which calls the typed emitter from its submission entry points, starting with `src/actions/submit-form`).
- **Actions**: `conditional` (outputs `true`/`false`; conditions evaluated against template-interpolated values), `wait` (relative delay or until datetime), `httpRequest` (method, URL, headers, optional credential, templated body; output = response), `webSearch` (provider + credential + templated query), `llm` (provider + model + credential + templated prompt; output = text). `sendEmail` is the single domain action, registered by the mails module and reusing `sendEmail`/`sendSingleSend` (provider adapters, `EmailSetting`, idempotency, send log).
- **Registry**: engine exposes a node registry; modules register trigger/action definitions (config schema, designer component, executor). The engine executes any registered node generically as "config + input → output" (see ADR-0003/0004).

### Template expressions

- Node config strings support `{{ ... }}` expressions referencing the incoming token data and the trigger payload (and outputs of ancestor nodes generated from the predecessor that fired). An interpolator resolves them before execution. This keeps flows dynamic without wiring extra edges.

### UI (admin, `(routes)/automations`)

- Sidebar entry under "tools" with permission keys `automations.read` / `automations.write`.
- List view of Automations (name, status, last run outcome), editor view (React Flow canvas, node palette grouped into triggers/actions, per-node config panel with expression autocomplete assistance), publish action with validation (at least one trigger, no cycles).
- Executions view per Automation: filter by status/date; Run detail with the step trace (each Step: node, status, attempts, input/output, error).
- Credentials CRUD (type, name, encrypted secret; picker in node config).

### Testing Decisions

- **Seam 1 (primary) — the runner/ingestion, end-to-end against the test DB** (`DATABASE_URL` in `.env.test`, Vitest): node handles receive an injectable effect context (`mail`, `http`, `llm`, `webSearch`) so tests use in-memory recorders with zero side effects. Covers: ingestion by each trigger type, idempotency-key dedup, fan-out/per-token semantics, conditional output routing, wait/resume, retry-on-transient, snapshot immutability (republish mid-run), 500-step guard, ledger shape, expression interpolation, send-email idempotency.
- **Seam 2 — the node registry**: unit tests per handler (conditional evaluation, template interpolation, HTTP/LLM/web-search request shaping, email config mapping). Pure functions tested without DB where possible.
- No component tests for the canvas/UI (not a repo convention); rely on `npm run lint` and `npm run build` plus manual verification.
- Prior art: no automated tests exist yet; the Vitest-on-test-DB convention is documented in AGENTS.md.

## Out of Scope

- Full version history (rollback/diff of Automations) — snapshot-at-publish covers the need (ADR-0004).
- Joins (wait-for-all), loops/cycles, a code/JavaScript node, cross-step event waiting.
- Domain-aware engine features (no contact/email concept in run/step models — ADR-0005).
- More domain actions beyond Send Email (create blog draft, publish post) — deferred, easy once the registry exists.
- More internal trigger events beyond `form.submitted` (`subscription.created`, `contact.created`, …) — each is one emitter call + one trigger definition.
- Fine-grained RBAC beyond the standard read/write permission keys.
- Multi-tenancy, i18n, scheduler/queue vendor (Inngest) — Inngest kept only as a documented migration path (ADR-0003).

## Further Notes

- The core nurturing case must work end-to-end first: `form.submitted` → Wait 1 day → Send Email → Wait 2 days → Send Email → Wait 2 days → Send Email.
- Implementation is being started by hand; the spec and tickets are the coordination artefact for later reconvergence.
