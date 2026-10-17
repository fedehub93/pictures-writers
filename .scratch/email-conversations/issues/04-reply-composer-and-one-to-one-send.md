# 04: Reply composer and one-to-one send

**What to build:** A user can compose a reply inside a conversation, use the account signature pre-filled and editable before sending, attach files, send the message through the provider, and see the outbound message appear in the thread. One-to-one sends count against `maxEmailsPerDay`; broadcast single sends do not.

**Blocked by:** 03 Inbox read UI

**Status:** ready-for-agent

- [ ] `EmailProviderAdapter` exposes `sendOneToOne` with support for `to`, `from`, `subject`, `html`, `text`, `replyTo`, and attachments.
- [ ] Resend adapter implements `sendOneToOne` using `resend.emails.send` with URL-based attachments.
- [ ] tRPC mutation validates the user’s permission on the account, checks the transactional quota, uploads outbound attachments to storage, calls the adapter, and persists an `EmailMessage` with direction `OUTBOUND` and status `SENT`.
- [ ] Composer UI is available inside a conversation, pre-fills the `EmailAccount` signature, allows editing and removal, and supports file attachments.
- [ ] The sent message appears immediately in the conversation thread.
- [ ] `getTodayEmailsAvailable` and related call sites are updated so `maxEmailsPerDay` counts only transactional/one-to-one sends, not marketing broadcasts.
- [ ] End-to-end tests cover successful replies, quota enforcement, and adapter invocation.
