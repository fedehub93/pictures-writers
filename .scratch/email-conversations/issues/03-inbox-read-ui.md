# 03: Inbox read UI

**What to build:** A backoffice user can select among the `EmailAccount` records they are allowed to use, see a conversation inbox with unread badges, open a conversation, and read the full thread of inbound and outbound messages including attachments.

**Blocked by:** 01 End-to-end inbound receiving, 02 EmailAccount admin CRUD and permissions

**Status:** ready-for-agent

- [ ] Account selector shows only accounts permitted to the current user and falls back to the default account.
- [ ] Inbox lists conversations for the selected account, excluding soft-deleted ones, with `hasUnread` highlighted.
- [ ] Conversation detail view shows the message thread, sender/recipient, subject, body, and timestamps.
- [ ] Inbound attachments are rendered as downloadable links.
- [ ] tRPC queries enforce account permissions (users cannot read conversations from accounts they are not assigned to).
- [ ] UI tests verify inbox rendering and account scoping.
