# 01: End-to-end inbound receiving

**What to build:** The system can receive an inbound email via the Resend webhook, verify its signature, match it to the correct `EmailAccount`, fetch the email body and attachments, persist attachments to application storage, and create a `Conversation`, `EmailMessage`, and `EmailAttachment` rows in the database.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] Prisma schema includes `EmailAccount`, `EmailAccountUserPermission`, `Conversation`, `EmailMessage`, `EmailAttachment`, enums, and indexes; migration runs cleanly.
- [x] `EmailProviderAdapter` interface exposes inbound methods (`fetchInbound`, `listInboundAttachments`, `getAttachmentDownloadUrl`).
- [x] Resend adapter implements the inbound contract using mocked Resend client tests.
- [x] A webhook endpoint consumes `email.received`, verifies the webhook signature, discards events for unknown `to` addresses, and routes valid events to the inbound handler.
- [x] The handler fetches the full email body and attachment metadata, downloads each attachment to application storage, and stores the resulting URL.
- [x] A `Conversation` is created (or reused) per `EmailAccount` + contact email address; an `EmailMessage` with direction `INBOUND` and its `EmailAttachment` rows are persisted.
- [x] The `Conversation.hasUnread` flag is set to `true` when a new inbound message arrives.
- [x] End-to-end tests verify the full inbound flow with a mocked provider and storage.

## Comments

Delivered:

- `prisma/schema.prisma` — `EmailMessageDirection` / `EmailMessageStatus` enums plus `EmailAccount`, `EmailAccountUserPermission`, `Conversation`, `EmailMessage`, `EmailAttachment` models (with `User` and `EmailContact` back-relations); migration `20261017120000_add_email_conversations`.
- `src/modules/mails/lib/types.ts` — inbound contract `EmailInboundAdapter` (now extended by `EmailProviderAdapter`), `InboundEmail`, `InboundAttachmentMetadata`, `InboundWebhookData`, `VerifiedWebhookEvent`, and the `isReceivedEmailEvent` narrowing helper.
- `src/modules/mails/lib/adapters/resend-adapter.ts` — `verifyWebhook`, `fetchInbound`, `listInboundAttachments`, `getAttachmentDownloadUrl` over the Resend receiving API.
- `src/modules/mails/conversations/lib/attachment-storage.ts` — `AttachmentStorage` seam plus the UploadThing implementation used to copy inbound attachments out of the provider's expiring URLs.
- `src/modules/mails/conversations/lib/handle-inbound-email.ts` — matches an active `EmailAccount` by recipient, copies attachments to storage, and persists the Conversation, INBOUND EmailMessage and EmailAttachments; reuses threads per account + contact and sets `hasUnread`; idempotent on provider email id.
- `src/app/api/webhooks/resend/route.ts` — verifies the Svix signature, ignores non-`email.received` events, and routes verified inbound email to the handler.
- Coverage: `resend-adapter.test.ts` (+ inbound cases), `handle-inbound-email.test.ts` (7), `route.test.ts` (6). Existing adapter fakes updated via `src/modules/mails/lib/__tests__/inbound-adapter-stubs.ts`.
- Verified: full suite (1015 tests) green, `npx tsc --noEmit --incremental false` clean, scoped eslint clean.

New environment variable: `NEXT_RESEND_WEBHOOK_SECRET` (Resend webhook signing secret).
