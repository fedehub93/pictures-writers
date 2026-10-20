# 04: Star action and Starred view

**What to build:** A backoffice user can star and unstar a conversation, and the Starred view returns the conversations they starred, newest first.

**Blocked by:** 01 Personal read state foundation

**Status:** ready-for-agent

- [ ] `conversations.setStarred({ id, starred })` writes `starredAt` on the caller's `ConversationUserState`, creating the row when absent.
- [ ] `getMany` accepts `view: "starred"` and returns only conversations starred by the caller.
- [ ] Every conversation in `getMany` carries `isStarred` for the caller.
- [ ] Star/unstar is available from the row kebab and the detail header, using the canonical term **Starred** (not Important/Flagged).
- [ ] Starring does not change `Conversation.updatedAt` or `lastMessageAt`, so the inbox order is unaffected.
- [ ] Tests: star is per-user, unstar removes it from the view, and a starred archived conversation stays in Starred.

## Comments
