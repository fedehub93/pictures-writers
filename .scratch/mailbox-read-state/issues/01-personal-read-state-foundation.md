# 01: Personal read state foundation

**What to build:** The database and query layer for per-user read state: a `ConversationUserState` model, `lastMessageAt` / `lastInboundAt` on `Conversation`, the migration that backfills them and drops `hasUnread`, and a `getCounts` procedure returning unread totals per account and overall.

**Blocked by:** —

**Status:** resolved

- [x] `ConversationUserState` exists with a unique `(userId, conversationId)` constraint, nullable `lastReadAt` and `starredAt`, and cascading deletes on both relations.
- [x] `Conversation` gains `lastMessageAt` and `lastInboundAt`; `hasUnread` is dropped.
- [x] A single migration creates the table, adds the columns, backfills `lastMessageAt` / `lastInboundAt` from existing messages, seeds `ConversationUserState` rows with `lastReadAt = now` for every existing `(user, conversation)` pair among permitted accounts, then drops `hasUnread`. No table is recreated and no data is restored.
- [x] `lastMessageAt` and `lastInboundAt` are maintained where inbound and outbound `EmailMessage` rows are created, including replies and brand-new conversations.
- [x] `conversations.getCounts()` returns `{ totalUnread, accounts: [{ emailAccountId, unread, archived }] }`, scoped to the caller's `EmailAccountUserPermission` rows and ignoring archived and deleted conversations.
- [x] Unread comparison is a single raw query with a LEFT JOIN, treating a missing state row as never read.
- [x] Tests: backfill correctness, per-user isolation, archived/deleted exclusion, and a user with no account permission sees zero.

## Comments

Delivered in `561227d1`:

- Schema: `ConversationUserState` (`@@unique([userId, conversationId])`, both relations cascade) and `Conversation.lastMessageAt` / `lastInboundAt`; `hasUnread` removed.
- Migration `20261020120000_personal_conversation_read_state`: creates the table, adds the columns, backfills from `MAX(COALESCE("sentAt", "createdAt"))`, seeds read state as `CURRENT_TIMESTAMP`, then drops `hasUnread`. Existing schema objects are altered, not recreated.
- Activity timestamps are stamped through `stampConversationActivity`, using `GREATEST` so delayed or out-of-order messages cannot move a conversation backwards. Wired into inbound handling, replies, and brand-new outbound conversations.
- `conversations.getCounts()` runs one raw `LEFT JOIN` query starting from `EmailAccountUserPermission`, counting unread (non-archived, non-deleted, missing state = never read) and archived per account, with `totalUnread` as the sum.
- `getMany` now derives per-user `isUnread` and orders by `lastMessageAt desc` (nulls last).
- Tests cover migration schema and backfill, missing-state semantics, per-user isolation for `getCounts` and `getMany`, archived/deleted exclusion, no-permission zero, timestamp monotonicity, and the existing inbound/send paths.
- Verification: `npx tsc --noEmit` clean; full Vitest suite 142 files / 1217 tests green.
