# 04: Reply composer and one-to-one send

**What to build:** A user can compose a reply inside a conversation, use the account signature pre-filled and editable before sending, attach files, send the message through the provider, and see the outbound message appear in the thread. One-to-one sends count against `maxEmailsPerDay`; broadcast single sends do not.

**Blocked by:** 03 Inbox read UI

**Status:** resolved

- [x] `EmailProviderAdapter` exposes `sendOneToOne` with support for `to`, `from`, `subject`, `html`, `text`, `replyTo`, and attachments.
- [x] Resend adapter implements `sendOneToOne` using `resend.emails.send` with URL-based attachments.
- [x] tRPC mutation validates the user's permission on the account, checks the transactional quota, uploads outbound attachments to storage, calls the adapter, and persists an `EmailMessage` with direction `OUTBOUND` and status `SENT`.
- [x] Composer UI is available inside a conversation, pre-fills the `EmailAccount` signature, allows editing and removal, and supports file attachments.
- [x] The sent message appears immediately in the conversation thread.
- [x] `getTodayEmailsAvailable` and related call sites are updated so `maxEmailsPerDay` counts only transactional/one-to-one sends, not marketing broadcasts.
- [x] End-to-end tests cover successful replies, quota enforcement, and adapter invocation.

## Comments

Delivered:

- `src/modules/mails/lib/types.ts` — `OutboundAttachment`, `SendOneToOneParams`, `SendOneToOneResult` and the new `sendOneToOne` member on `EmailProviderAdapter`.
- `src/modules/mails/lib/adapters/resend-adapter.ts` — `sendOneToOne` over `emails.send`, mapping attachments to URL-based `path` entries and returning `{ success, externalId }`.
- `src/modules/mails/conversations/lib/send-one-to-one.ts` — `sendConversationMessage` use-case: loads the thread, enforces the quota, resolves the provider adapter (overridable for tests), sends, then records the OUTBOUND/`SENT` `EmailMessage` + attachments and bumps the conversation's activity in one transaction. `ConversationSendError` carries `NOT_FOUND` / `QUOTA_EXCEEDED` / `PROVIDER_ERROR`.
- `src/modules/mails/conversations/server/procedures.ts` — `sendReply` mutation (`permissionProcedure(MAIL_READ)`): loads the conversation, enforces the per-account permission via `assertAccountAccess`, then calls the use-case and maps typed errors to `TRPCError`s (`QUOTA_EXCEEDED` → `TOO_MANY_REQUESTS`).
- `src/modules/mails/lib/mail.ts` — `getEmailsSentToday` now counts `EmailSendLog` (transactional/automation) plus OUTBOUND `EmailMessage` (one-to-one); marketing SingleSends write to neither table, so they no longer/implicitly never count. `getTodayEmailsAvailable` treats an unset `maxEmailsPerDay` as unlimited.
- Composer UI under `src/modules/mails/conversations/ui/components/composer/**` — a trimmed Tiptap editor (bold/italic/underline/strike, alignment, lists, links; no headings/images/tables/slash menu) with `ComposerToolbar`, `ComposerAttachments` (UploadThing `emailAttachments` endpoint, paperclip + image buttons) and `ReplyComposer` (To read-only, Subject prefilled with `Re:`, signature prefilled from the account and fully editable/removable, Discard/Send). Wired into `ConversationDetail` through a `replySlot` so the detail component keeps its existing rendering tests provider-free.
- `useSendReply` invalidates `conversations.getOne` and the owning account's `getMany` so the sent message appears immediately and the thread re-sorts.
- Provider upload helper: `useUploadThing` added to `src/lib/uploadthing.ts`; new `emailAttachments` blob endpoint (auth-gated) in `src/app/api/uploadthing/core.ts`.
- Coverage: `resend-adapter.test.ts` (+4 `sendOneToOne`), `send-one-to-one.test.ts` (8 — success/attachments/subject/from, activity bump, NOT_FOUND, quota, provider failure), `quota.test.ts` (4 — counting semantics), `conversations-router.test.ts` (+5 `sendReply` permission/validation/error mapping), `send-reply-e2e.test.ts` (2 — mutation → real use-case → faked adapter → DB, quota). `format.test.ts` (+6 for `replySubject`/`signatureToHtml`).
- Verified: full suite (1094 tests) green, `npx tsc --noEmit` clean, scoped eslint clean (only pre-existing `no-explicit-any` warnings in the resend adapter).

Notes:

- **Attachment storage placement.** Outbound attachments are uploaded to application storage client-side through the existing UploadThing flow before the mutation runs; the mutation receives the stored URLs, persists them as `EmailAttachment` rows and hands them to the provider (spec: "uploaded through the existing application storage flow before the message is sent"). The mutation does not re-upload. Attachment URLs are accepted as-is (no host allow-listing) — hardening left for a follow-up.
- **Permission.** `sendReply` is gated by `mail.read` plus the per-account `EmailAccountUserPermission` (the same gate as reading), since the catalog has no dedicated `mail.send`. A user who cannot read an inbox cannot send from it.
- **Quota when unset.** `maxEmailsPerDay` unset means uncapped; the counting semantics change requested by this ticket only concerns which sends count, not the null case. `getTodayEmailsAvailable` was previously unused.
