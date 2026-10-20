# 03: Thread entry, auto-read and manual read actions

**What to build:** Opening a conversation lands on its newest message, marks the conversation read when the window is visible, and offers manual "mark read" / "mark unread" from the list row and the detail header.

**Blocked by:** 01 Personal read state foundation

**Status:** resolved

- [x] The thread keeps `createdAt asc`, scrolls to the newest message on open, and collapses every preceding message when the conversation has more than two messages; clicking a header expands it.
- [x] `use-mark-read-on-open` marks the conversation read on open only when `document.visibilityState === "visible"`.
- [x] A new inbound message arriving while the thread is open is marked read; sending a reply marks the conversation read.
- [x] `conversations.markRead` sets `lastReadAt`; `conversations.markUnread` clears it, making all inbound messages unread again.
- [x] Read actions live in a kebab menu on the conversation row and in the detail header, replacing the current plain icon buttons where they overlap.
- [x] Hooks invalidate `getMany`, `getCounts` and `getOne`; components receive callbacks and do not import `useTRPC`.
- [x] Tests: visibility gating, read/unread transitions, collapse threshold and expansion state.

## Comments

- `conversations.markRead` upserts the caller's `ConversationUserState` with `lastReadAt = now`; `markUnread` upserts with `null`. Both scope through `getActiveConversation` + `assertAccountAccess`, so inaccessible conversations are reported as missing. `getOne` now carries the caller's derived `isUnread`.
- Replying marks the conversation read server-side after a successful send, so the outbound acknowledgement also clears unread state when the window was hidden.
- `use-mark-read-on-open` handles one action per inbound watermark, subscribes to `visibilitychange`, and deliberately does not consume a watermark while hidden: a thread opened in a background tab becomes read once the user actually looks at it. A manual "mark unread" is left alone until the next inbound message. The open conversation polls every 30 seconds so a new inbound message is picked up while visible.
- `useMarkConversationRead` / `useMarkConversationUnread` invalidate all `getMany` views, `getCounts` and the open `getOne`; `useSendReply` now invalidates `getCounts` too.
- Row kebab and a detail-header kebab expose Mark as read/unread with callbacks passed from `ConversationsView`; `ConversationActions` keeps its existing icon buttons.
- `message-expansion` keeps the newest message open and makes only earlier messages collapsible. `ConversationDetail` tracks expansion per conversation, scrolls to a bottom sentinel on open and when new messages arrive.
- Tests: router transitions (never read → read → new inbound → unread → read), per-user isolation, reply marks read, inaccessible rejection, visibility/watermark action table, kebab label/rendering, long vs short conversation markup.
- Verification: `npx tsc --noEmit` clean; ESLint on the module clean; full Vitest suite 146 files / 1242 tests green.
