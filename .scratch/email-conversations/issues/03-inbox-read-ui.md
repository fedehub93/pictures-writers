# 03: Inbox read UI

**What to build:** A backoffice user can select among the `EmailAccount` records they are allowed to use, see a conversation inbox with unread badges, open a conversation, and read the full thread of inbound and outbound messages including attachments.

**Blocked by:** 01 End-to-end inbound receiving, 02 EmailAccount admin CRUD and permissions

**Status:** resolved

- [x] Account selector shows only accounts permitted to the current user and falls back to the default account.
- [x] Inbox lists conversations for the selected account, excluding soft-deleted ones, with `hasUnread` highlighted.
- [x] Conversation detail view shows the message thread, sender/recipient, subject, body, and timestamps.
- [x] Inbound attachments are rendered as downloadable links.
- [x] tRPC queries enforce account permissions (users cannot read conversations from accounts they are not assigned to).
- [x] UI tests verify inbox rendering and account scoping.

## Comments

Delivered:

- `src/modules/mails/conversations/schemas.ts` — `conversationListSchema` (`emailAccountId`) and `conversationGetOneSchema` (`id`).
- `src/modules/mails/conversations/server/access.ts` — `assertAccountAccess` guards area reads by the `EmailAccountUserPermission` join row.
- `src/modules/mails/conversations/server/procedures.ts` — `conversations` tRPC router: `getMany` (per-account list, `deletedAt: null`, newest activity first, last-message snippet/subject/direction/attachment flag and message count) and `getOne` (full thread with attachments, permission scoped inside the query so an inaccessible thread is indistinguishable from a missing one). Both use `permissionProcedure(MAIL_READ)`.
- `src/modules/mails/conversations/lib/format.ts` — plain-text body extraction (`htmlToText`), preview, initials, file size and relative/full date formatting. Email HTML is never rendered as raw markup (untrusted input); the thread shows text only.
- UI under `src/modules/mails/conversations/ui/**` — `ConversationsView` (account selector + list + reading pane, responsive list/detail on small screens), `AccountSelector`, `ConversationList`/`ConversationListItem` (unread dot, avatar, subject, snippet, attachment hint), `ConversationDetail` + `MessageItem` (sender, recipient, subject, body, timestamp, attachments) and `AttachmentList` (downloadable links). Empty states use the new shadcn `Empty` component.
- Accounts: `useSuspenseAllowedEmailAccounts` hook and `prefetchAllowedEmailAccounts`; `EmailAccountAllowed` type.
- Route `/admin/mails/inbox` (layout gated by `mail.read`) and an "Inbox" sidebar entry under Mails.
- Coverage: `conversations-router.test.ts` (10 — account scoping, soft-delete exclusion, ordering, thread + attachments, inbox-render fields), `format.test.ts` (14), `conversations-rendering.test.tsx` (5 — `renderToStaticMarkup` inbox/list/detail rendering and empty states).
- Verified: full suite (1064 tests) green, `npx tsc --noEmit` clean, scoped eslint clean.

Notes: read-state clearing (`hasUnread`) is intentionally out of scope for this ticket — no ticket specifies it, and mutating `Conversation.updatedAt` would corrupt the inbox ordering. Unread is highlighted as the checklist requires. Sidebar grouping into Marketing/Conversations is ticket 06; this ticket only adds a reachable "Inbox" link.
