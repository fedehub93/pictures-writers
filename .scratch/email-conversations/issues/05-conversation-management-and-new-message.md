# 05: Conversation management and new message

**What to build:** A user can start a brand-new one-to-one conversation to any email address, archive a conversation, soft-delete a conversation, and create a `Contact` from an unknown sender with one click.

**Blocked by:** 04 Reply composer and one-to-one send

**Status:** resolved

- [x] “New message” UI lets the user pick an allowed account, enter a recipient address, subject, body, and attachments, and send.
- [x] Sending a new message creates a `Conversation` and an outbound `EmailMessage`; if the recipient is not a `Contact`, no contact is auto-created.
- [x] Archive action sets `archivedAt`; archived conversations can be filtered separately or hidden from the main inbox.
- [x] Delete action sets `deletedAt` (soft delete); a future trash view can later show these.
- [x] “Create contact” action on a conversation creates a `Contact` from the conversation’s `contactEmail` and `contactName` and links the conversation to it.
- [x] Tests verify new-message flow, archive/soft-delete, and manual contact creation.

## Comments

Delivered:

- `src/modules/mails/conversations/lib/send-new-message.ts` — `sendNewMessage` use-case: loads the account, enforces the transactional quota, sends via the provider, then find-or-creates the conversation for the account + recipient (grouping by address), links an existing `EmailContact` when there is one (never auto-creates), persists the OUTBOUND/`SENT` message + attachments, and unarchives a reused conversation so the sent message lands in the inbox. `NewMessageError` carries `ACCOUNT_NOT_FOUND` / `QUOTA_EXCEEDED` / `PROVIDER_ERROR`.
- `src/modules/mails/conversations/lib/outbound.ts` — shared send seam (`assertTransactionalQuota`, `resolveProviderAdapter`, `outboundMessageCreateData`) extracted from the reply use-case so reply and new-message share one code path.
- `src/modules/mails/conversations/lib/sender.ts` — `resolveFrom` extracted from `send-one-to-one`.
- `src/modules/mails/conversations/server/procedures.ts` — `sendNew`, `setArchived` (sets/clears `archivedAt`), `remove` (soft delete via `deletedAt`), `createContact` (creates/links an `EmailContact` from `contactEmail` + `contactName`); `getMany` gained an `archived` filter so archived threads are hidden from the main inbox; shared `getActiveConversation`, `toOutboundAttachments` and `trpcCodeForSendError` helpers remove duplication. All gated by `mail.read` plus the per-account `EmailAccountUserPermission`.
- `src/modules/mails/conversations/schemas.ts` — `conversationNewMessageSchema`, `conversationArchiveSchema`, `conversationIdSchema`, and the `archived` list filter. `format.ts` gained `splitName` for mapping `contactName` onto `firstName`/`lastName`.
- UI under `src/modules/mails/conversations/ui/**` — `NewMessageDialog` (account select, To, Subject, Tiptap body with the account signature pre-filled, attachments) launched from the inbox header; `ConversationActions` dropdown on the conversation header (Create contact when unlinked, Archive/Unarchive, Delete with confirmation); an Inbox/Archived tab filter in `ConversationsView`. Hooks `useSendNewMessage` and `use-conversation-actions` invalidate the thread and inbox queries on success.
- Coverage: `send-new-message.test.ts` (8 — new conversation + outbound message + attachments, no auto-contact, contact linking, reuse, unarchive-on-reuse, quota, unknown account, provider failure) and `conversations-router.test.ts` (+11 — archived filter, `sendNew` scoping/validation/error mapping, `setArchived`, soft-delete `remove`, `createContact` create/link/reuse/already-linked/scoping).
- Verified: full suite (1116 tests) green, `npx tsc --noEmit` clean, scoped eslint clean.

Notes:

- Manually-created contacts are stored with `isSubscriber: false` — a correspondent who emailed in has not opted into marketing, so they are not assumed to be a subscriber.
- Reusing an existing conversation and clearing `archivedAt` deviates from a literal "creates a Conversation" reading of the checklist, but threading is by address (spec) so reusing avoids fragmenting the thread; unarchiving keeps the UI's "sent, show it in the inbox" promise.
- Unarchive is included alongside archive so the Archived view is not a dead end.

