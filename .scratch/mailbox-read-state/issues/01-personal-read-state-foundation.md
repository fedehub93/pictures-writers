# 01: Personal read state foundation

**What to build:** The database and query layer for per-user read state: a `ConversationUserState` model, `lastMessageAt` / `lastInboundAt` on `Conversation`, the migration that backfills them and drops `hasUnread`, and a `getCounts` procedure returning unread totals per account and overall.

**Blocked by:** —

**Status:** ready-for-agent

- [ ] `ConversationUserState` exists with a unique `(userId, conversationId)` constraint, nullable `lastReadAt` and `starredAt`, and cascading deletes on both relations.
- [ ] `Conversation` gains `lastMessageAt` and `lastInboundAt`; `hasUnread` is dropped.
- [ ] A single migration creates the table, adds the columns, backfills `lastMessageAt` / `lastInboundAt` from existing messages, seeds `ConversationUserState` rows with `lastReadAt = now` for every existing `(user, conversation)` pair among permitted accounts, then drops `hasUnread`. No table is recreated and no data is restored.
- [ ] `lastMessageAt` and `lastInboundAt` are maintained where inbound and outbound `EmailMessage` rows are created, including replies and brand-new conversations.
- [ ] `conversations.getCounts()` returns `{ totalUnread, accounts: [{ emailAccountId, unread, archived }] }`, scoped to the caller's `EmailAccountUserPermission` rows and ignoring archived and deleted conversations.
- [ ] Unread comparison is a single raw query with a LEFT JOIN, treating a missing state row as never read.
- [ ] Tests: backfill correctness, per-user isolation, archived/deleted exclusion, and a user with no account permission sees zero.

## Comments
