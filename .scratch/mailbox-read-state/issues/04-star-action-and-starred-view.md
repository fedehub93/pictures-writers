# 04: Star action and Starred view

**What to build:** A backoffice user can star and unstar a conversation, and the Starred view returns the conversations they starred, newest first.

**Blocked by:** 01 Personal read state foundation

**Status:** resolved

- [x] `conversations.setStarred({ id, starred })` writes `starredAt` on the caller's `ConversationUserState`, creating the row when absent.
- [x] `getMany` accepts `view: "starred"` and returns only conversations starred by the caller.
- [x] Every conversation in `getMany` carries `isStarred` for the caller.
- [x] Star/unstar is available from the row kebab and the detail header, using the canonical term **Starred** (not Important/Flagged).
- [x] Starring does not change `Conversation.updatedAt` or `lastMessageAt`, so the inbox order is unaffected.
- [x] Tests: star is per-user, unstar removes it from the view, and a starred archived conversation stays in Starred.

## Comments

- `conversations.setStarred` upserts the caller's `ConversationUserState.starredAt` (creating the row when absent) and scopes through `getActiveConversation` + `assertAccountAccess`. It never updates the shared `Conversation`, so `updatedAt` and `lastMessageAt` are untouched.
- `getMany` now takes `view: "inbox" | "starred" | "archived"` instead of `archived: boolean`. Starred selects non-deleted conversations with the caller's `starredAt` set and deliberately ignores `archivedAt`; both list rows and `getOne` carry `isStarred`.
- The row kebab and detail-header kebab share `ConversationReadMenu`, which now offers Star/Unstar before the read toggle. The rail exposes a **Starred** view with no count, and starred rows/threads show a filled star. The canonical term replaces any Important/Flagged wording.
- `useSetConversationStarred` invalidates every `getMany` view and the open `getOne`; list invalidation elsewhere now uses the `getMany` query-key prefix instead of enumerating archived flags.
- Tests: per-user star isolation, unstar removal, starred-archived retention, newest-first ordering, activity-timestamp invariance, inaccessible rejection, menu labels, starred indicators and the Starred nav item.
- Verification: `npx tsc --noEmit` clean; ESLint on the module clean; full Vitest suite 146 files / 1251 tests green.
