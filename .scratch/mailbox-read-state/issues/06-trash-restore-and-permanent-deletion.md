# 06: Trash restore and permanent deletion

**What to build:** From the Trash view a user can restore a conversation to the Inbox or permanently delete it, with the same shared-triage semantics as archive.

**Blocked by:** 05 Mailbox views and navigation

**Status:** ready-for-agent

- [ ] `conversations.restore({ id })` clears `deletedAt`, returning the conversation to the Inbox (or Archive if it was archived).
- [ ] `conversations.deleteForever({ id })` hard-deletes the conversation, cascading messages and attachments.
- [ ] Permanent deletion attempts to remove stored attachment files best-effort; a storage failure does not block the database deletion.
- [ ] Permanent deletion requires an explicit confirmation dialog naming the conversation.
- [ ] Both actions are available only from the Trash view and are gated by `mail.read` plus account access.
- [ ] `remove` keeps working from Inbox and Archive as the soft delete that feeds Trash.
- [ ] Tests: restore returns the conversation to the expected view, permanent deletion removes rows and attempts storage cleanup, and inaccessible conversations are rejected as missing.

## Comments
