# 03: Thread entry, auto-read and manual read actions

**What to build:** Opening a conversation lands on its newest message, marks the conversation read when the window is visible, and offers manual "mark read" / "mark unread" from the list row and the detail header.

**Blocked by:** 01 Personal read state foundation

**Status:** ready-for-agent

- [ ] The thread keeps `createdAt asc`, scrolls to the newest message on open, and collapses every preceding message when the conversation has more than two messages; clicking a header expands it.
- [ ] `use-mark-read-on-open` marks the conversation read on open only when `document.visibilityState === "visible"`.
- [ ] A new inbound message arriving while the thread is open is marked read; sending a reply marks the conversation read.
- [ ] `conversations.markRead` sets `lastReadAt`; `conversations.markUnread` clears it, making all inbound messages unread again.
- [ ] Read actions live in a kebab menu on the conversation row and in the detail header, replacing the current plain icon buttons where they overlap.
- [ ] Hooks invalidate `getMany`, `getCounts` and `getOne`; components receive callbacks and do not import `useTRPC`.
- [ ] Tests: visibility gating, read/unread transitions, collapse threshold and expansion state.

## Comments
