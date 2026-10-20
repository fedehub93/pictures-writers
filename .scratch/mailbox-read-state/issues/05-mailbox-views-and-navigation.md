# 05: Mailbox views and navigation

**What to build:** The mailbox panel is grouped into Mailbox (Inbox, Sent, Trash) and Filtered (Starred, Archive), with Inbox and Archive counts, a Sent view listing outbound messages, and a Trash view listing deleted conversations.

**Blocked by:** 01 Personal read state foundation, 04 Star action and Starred view

**Status:** resolved

- [x] `getMany` replaces `archived: boolean` with `view: "inbox" | "starred" | "archived" | "trash"`; Trash orders by `deletedAt desc`.
- [x] `conversations.getSentMessages({ emailAccountId })` returns outbound messages ordered `createdAt desc` with conversation id, subject, recipients, snippet and attachment hint.
- [x] Sent renders as its own message list; clicking a row opens the corresponding conversation.
- [x] `MailboxNav` renders the two groups with the icons from the mock, keeps Inbox active-state semantics, and shows counts only on Inbox (unread) and Archive (total).
- [x] The panel unread count comes from `getCounts` for the selected account instead of filtering the full list client-side.
- [x] Switching views clears the open conversation and any composer state, as it does today.
- [x] Tests: each view returns the expected rows, switching views resets selection, and Sent returns messages rather than conversations.

## Comments

- `getMany` accepts `trash` and orders that view by `deletedAt desc` (nulls last) rather than `lastMessageAt`; the other views keep newest-activity ordering. Trashed conversations remain excluded from Inbox, Starred and Archive.
- `conversations.getSentMessages` lists `OUTBOUND` messages for an accessible account in `createdAt desc` order, excluding messages whose conversation is trashed. Each row carries the conversation id, subject, `toAddresses` as recipients, a plain-text snippet and up to three attachment hints.
- Sent has its own `SentMessagesPanel` and `SentMessageList`; opening a row selects the conversation without leaving the Sent view. The panel keeps the mobile compose action, refresh control and message count.
- `MailboxNav` now groups Mailbox (Inbox, Sent, Trash) and Filtered (Starred, Archive). Only Inbox (unread) and Archive (total) render counts; the labels follow the spec, so "Archived" became "Archive".
- Trash rows are read-only for now: selecting a deleted conversation would fail `getOne`, so their row button and kebab are disabled until ticket 06 adds restore and permanent-delete actions.
- The view reads Inbox and Archive counts from `getCounts` for the selected account instead of filtering the loaded Inbox list. Sends and trashes invalidate `getSentMessages` so the Sent list follows the shared conversation state; the hook only fetches while Sent is open.
- Switching views or accounts clears selection, composer and reply state through a shared `resetMailboxInteraction` helper.
- Tests: trash ordering and exclusion from Inbox/Starred/Archive, Sent ordering by `createdAt`, recipients/snippets/attachments, trashed and other-account exclusion, inaccessible rejection, nav groups and count placement, Sent list rendering and empty state, and the interaction reset.
- Verification: `npx tsc --noEmit` clean; ESLint on the module clean; full Vitest suite 147 files / 1260 tests green.
