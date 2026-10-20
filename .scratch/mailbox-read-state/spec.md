Status: ready-for-agent
Labels: ready-for-agent

# Mailbox views and personal read state

## Problem Statement

The Conversations area exposes a single inbox with an archived filter. A backoffice user cannot tell how many conversations need attention: the sidebar has no badge, the mailbox panel derives its count client-side from the full list, and `Conversation.hasUnread` is a global boolean that nothing ever clears. Opening a conversation marks nothing read, so the unread highlight is permanent and identical for every user of a shared account.

Mailbox navigation is also incomplete. Deleted conversations disappear with no Trash view, outbound mail has no Sent view, and there is no way to mark a conversation as important. The thread opens on its oldest message, which is the opposite of what a user returning to an inbox expects.

## Solution

Introduce Mailbox views over the existing conversation model, add a personal read state per backoffice user, and surface unread counts in both the admin sidebar and the inbox panel. Add Starred, Sent and Trash views, star and read actions, auto-read on open, and a thread entry that lands on the newest message.

No folder or label model is introduced: views are queries over conversations, not containers.

## User Stories

1. As a backoffice user, I want the admin sidebar to show how many conversations are unread across the accounts I can access, so that I notice new mail while working elsewhere.
2. As a backoffice user, I want the inbox panel badge to show the unread count of the selected account, so that I can triage that inbox.
3. As a backoffice user, I want read state to be personal, so that my colleague reading a shared conversation does not hide it from me.
4. As a backoffice user, I want a conversation to become read when I open it, so that I do not have to clean up manually.
5. As a backoffice user, I want a conversation to stay unread if I was not looking at the window, so that I do not miss mail I never actually saw.
6. As a backoffice user, I want to mark a conversation unread again, so that it comes back to my attention.
7. As a backoffice user, I want to star a conversation, so that I can keep track of the important ones.
8. As a backoffice user, I want a Starred view, so that I can list only the conversations I care about.
9. As a backoffice user, I want a Sent view listing outbound messages, so that I can check what we sent and when.
10. As a backoffice user, I want a Trash view, so that a deleted conversation is not lost.
11. As a backoffice user, I want to restore a conversation from Trash, so that a mistaken deletion is reversible.
12. As a backoffice user, I want to permanently delete a conversation from Trash, so that the team can clean up for good.
13. As a backoffice user, I want the mailbox navigation grouped into Mailbox (Inbox, Sent, Trash) and Filtered (Starred, Archive), so that the overview matches the mental model of an email client.
14. As a backoffice user, I want opening a conversation to show me the newest message, so that I read the latest reply without scrolling.
15. As a backoffice user, I want older messages collapsed in a long thread, so that the newest reply is immediately readable.
16. As a backoffice user, I want counts to refresh on their own, so that the badges stay roughly current without reloading the page.

## Implementation Decisions

- **Personal read state lives in `ConversationUserState`.** One row per `(userId, conversationId)`, created lazily when the user first opens or stars a conversation. A missing row means the conversation has never been read by that user. Read and star are personal; archive and deletion stay on `Conversation` (ADR-0025).
- **Unread is derived, not stored.** A conversation is unread for a user when it has an inbound message newer than the user's `lastReadAt` (or when the user has no state row and the conversation has any inbound message). `Conversation.hasUnread` is dropped.
- **`lastReadAt` is a watermark.** "Mark unread" sets it to `null` (all inbound mail becomes unread again). "Mark read" sets it to the current time. The UI never marks individual messages.
- **Denormalized timestamps on `Conversation`.** `lastMessageAt` (newest message of any direction) replaces `updatedAt` as the list ordering key, and `lastInboundAt` makes the unread join cheap. Both are maintained wherever an `EmailMessage` is created.
- **Unread counts are computed in SQL.** `Conversation.lastInboundAt` is compared with `ConversationUserState.lastReadAt` in a raw query using a LEFT JOIN, because Prisma cannot compare columns across relations. `$queryRaw` is already used by scheduler and automations.
- **`view` is an API input, not a database column.** `getMany` takes `view: "inbox" | "starred" | "archived" | "trash"` and translates it into a `where`. Sent is a separate procedure over `EmailMessage`, ordered by `createdAt desc`.
- **Auto-read fires on open when the document is visible.** If `document.visibilityState` is not `"visible"`, nothing is marked. A new inbound message arriving while the thread is open is marked read; sending a reply also marks the conversation read.
- **Thread stays chronological, entry lands on the newest.** Messages remain ordered `createdAt asc`; the detail scrolls to the last message on open and collapses the preceding messages when the thread has more than two. Expansion state is local to the open conversation.
- **Navigation shape.** Mailbox: Inbox, Sent, Trash. Filtered: Starred, Archive. Only Inbox carries an unread badge; Archive keeps its total; Sent and Trash carry no count.
- **Counts and polling.** The sidebar badge is the sum of unread conversations across every account the user can access, polled every 30 seconds. The panel badge is per selected account.
- **Hooks own the operations.** `use-conversation-actions` gains read, star, restore and permanent-delete operations; new `use-mark-read-on-open` and `use-mailbox-counts` hooks encapsulate visibility logic and polling. UI components receive callbacks and never call `useTRPC` directly. Mutations invalidate queries — no optimistic updates, matching the rest of the admin.

The schema addition:

```prisma
model ConversationUserState {
  id String @id @default(uuid())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  conversationId String

  lastReadAt DateTime?
  starredAt  DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, conversationId])
  @@index([userId])
}

model Conversation {
  // ...existing fields; hasUnread removed
  lastMessageAt DateTime?
  lastInboundAt DateTime?

  userStates ConversationUserState[]
}
```

### API contract

- `conversations.getMany({ emailAccountId, view })` — conversations for one view, ordered by `lastMessageAt desc` (`trash` ordered by `deletedAt desc`), each with `isUnread` and `isStarred` for the current user.
- `conversations.getSentMessages({ emailAccountId })` — outbound `EmailMessage` rows ordered `createdAt desc`, with conversation id, subject, recipients, snippet and attachments.
- `conversations.getCounts()` — `{ totalUnread, accounts: [{ emailAccountId, unread, archived }] }`, scoped to the accounts the user may access.
- `conversations.markRead({ id })`, `conversations.markUnread({ id })`.
- `conversations.setStarred({ id, starred })`.
- `conversations.restore({ id })`, `conversations.deleteForever({ id })`.
- Existing `setArchived` and `remove` are retained.

## Testing Decisions

- Router tests exercise external behavior: a user sees only permitted accounts, read state does not leak between users, unread counts ignore archived and deleted conversations, and each view returns the expected conversations.
- Read transitions get a table-driven test: never read → mark read → new inbound → mark unread → mark read, asserting `lastReadAt` and the derived unread flag.
- The migration backfill is covered by seeding messages in the test database and asserting `lastMessageAt` / `lastInboundAt` and the seeded `ConversationUserState` rows.
- Sent returns messages, not conversations, from both directions correctly filtered.
- Rendering tests cover the mailbox navigation groups, the row menus, the collapsed thread and the Trash actions, following the existing `renderToStaticMarkup` pattern.
- Storage cleanup on permanent deletion is tested through the existing attachment storage adapter seam.

## Out of Scope

- Draft persistence and a Draft view.
- Spam, phishing reporting, mute and block: there is no source of truth for spam and no blocklist.
- Custom folders, labels, and "Add Folder". `view` is shaped so a folder input can be added later without reshaping existing procedures.
- Per-message read state.
- Automatic trash purge.
- Realtime updates (SSE/websockets); polling is sufficient.
- Optimistic UI updates.
- Print.
