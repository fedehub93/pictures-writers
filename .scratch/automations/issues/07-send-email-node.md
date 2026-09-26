# 07: Domain action — Send Email (registered by the mails module)

**What to build:** The one domain action in the MVP catalogue, contributed by the mails module through the node registry. The node takes a recipient (any address, or the responder's address from the run payload), subject, and body — authorable once, with template expressions for the dynamic parts — and sends through the existing mail pipeline (provider adapters, mail settings, send log). Sends are idempotent per (run, step) so retries never double-send, and are audited via the existing send log. A node configuration panel lives with the mails module's admin UI.

**Blocked by:** 05

**Status:** resolved

- [x] The Send Email node appears in the palette under actions, contributed by the mails module without touching the engine.
- [x] Executing it sends a real email through the existing mail pipeline using the mail settings; success/failure is reflected in the Step ledger.
- [x] A retried Step does not send twice (idempotency per run/step); sends are recorded in the existing send log.
- [x] Recipient/subject/body fully support template expressions from the run payload and predecessor outputs.
- [x] Tests exercise it with an in-memory mail recorder; no real messages are sent in tests.

## Comments

Delivered (see `src/modules/mails/automations/` and the small `node-catalog` seam in `src/modules/automations/`):

- **Node + registry, contributed by mails.** `sendEmailNodeRegistry` (`node.ts`) exports a `sendEmail` handler; the runtime composes it via the existing `mergeNodeRegistries`, so the engine core (`node-registry.ts`, `graph.ts`) was *not* touched. The pristine handler interpolates its config with `resolveSendEmailConfig` (`lib/send-email-config.ts`) and delegates delivery to the injected `effects.mail`, keeping it testable with the in-memory recorder.
- **Real pipeline + idempotency.** `createAutomationMailEffect` (`lib/mail-effect.ts`) maps a node request onto `sendAutomationEmail` (`lib/send-automation-email.ts`), which resolves `EmailSetting`, sends through `sendEmail(email, { log: false })` (provider adapters), and owns the single `EmailSendLog` row keyed `automation:{runId}:{stepId}`. The audit row is **claimed before delivery** (and released if delivery fails), so a retried Step — or a crashed worker reclaiming the Step — finds the row and skips rather than sending twice. Transient provider errors surface as retryable `AutomationNodeError`s, permanent ones fail the Step. `EmailSendLog.idempotencyKey` was added (unique) in migration `20260926120000_add_email_send_log_idempotency_key`.
- **Runtime wiring.** `/api/automations/run` now calls `runDueAutomations({ registry: sendEmailNodeRegistry, effects: { ...unconfiguredEffects, mail: createAutomationMailEffect() } })`.
- **UI.** A tiny palette catalogue seam (`lib/node-catalog.ts` + `editor/config/node-catalog.ts`) lets the mails module contribute the Send Email entry under *actions*; `ActionNode` renders action nodes with a settings tool opening a `Sheet` that hosts the module's `SendEmailConfigPanel` (`mails/automations/ui/send-email-config-panel.tsx`, shadcn `Field`/`Input`/`Textarea`).
- **Tests (no real sends).** `send-email-config` + `node` unit tests (interpolation, missing config), `send-automation-email` + `mail-effect` DB tests with an injected transport (idempotent skip, audit row, transient classification), and an engine integration test (`automations/lib/__tests__/send-email-node.test.ts`) covering execution through the in-memory recorder plus a transient failure that retries and still sends exactly once.
- Verified: `npx tsc --noEmit` clean; `npx eslint` clean on all touched files; full `npm run test:run` 415/415 (52 files).

Non-blocking follow-ups:

- **Config schema / designer-component registration is not yet a module seam.** The executor and palette entry are genuinely modular, but the editor still names `SEND_EMAIL` in `node-components.ts`, `node-icons.ts` and `node-config-panels.tsx` (the panel *implementation* lives in the mails module). The full "one node descriptor registered by the module" seam (ADR-0003/0004, spec §Registry) is better built together with the generic HTTP/web-search/LLM nodes in issue 10, where the repetition becomes real.
- **Provider-level idempotency only on Resend.** Resend's `emails.send` receives the Step key as `Idempotency-Key`; SendGrid has no equivalent, so its crash safety rests solely on the `EmailSendLog` claim.
- **Claim-before-send favours at-most-once.** A crash between claiming the key and the provider accepting the message skips the send on retry (no double-send), which is the guarantee this ticket asks for but can drop a message in that rare window.