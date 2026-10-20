# 05: Mailbox views and navigation

**What to build:** The mailbox panel is grouped into Mailbox (Inbox, Sent, Trash) and Filtered (Starred, Archive), with Inbox and Archive counts, a Sent view listing outbound messages, and a Trash view listing deleted conversations.

**Blocked by:** 01 Personal read state foundation, 04 Star action and Starred view

**Status:** ready-for-agent

- [ ] `getMany` replaces `archived: boolean` with `view: "inbox" | "starred" | "archived" | "trash"`; Trash orders by `deletedAt desc`.
- [ ] `conversations.getSentMessages({ emailAccountId })` returns outbound messages ordered `createdAt desc` with conversation id, subject, recipients, snippet and attachment hint.
- [ ] Sent renders as its own message list; clicking a row opens the corresponding conversation.
- [ ] `MailboxNav` renders the two groups with the icons from the mock, keeps Inbox active-state semantics, and shows counts only on Inbox (unread) and Archive (total).
- [ ] The panel unread count comes from `getCounts` for the selected account instead of filtering the full list client-side.
- [ ] Switching views clears the open conversation and any composer state, as it does today.
- [ ] Tests: each view returns the expected rows, switching views resets selection, and Sent returns messages rather than conversations.

## Comments
