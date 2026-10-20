# Personal read state, shared triage

Status: accepted

A Conversation is shared by every backoffice user who can access its Email account. We keep read state and star personal — one `ConversationUserState` row per user and conversation — while archiving and deletion stay on the Conversation itself, so they act on the shared work item for the whole team.

Read state is inherently personal in a shared inbox: two support users looking at the same thread must be able to disagree about whether it is new. Star follows the same reasoning. Archive and deletion, by contrast, describe the state of the shared item; making them personal breaks permanent deletion, which destroys the shared object and cannot coherently belong to one user.

**Considered options**
- All state shared: simplest, but the inbox gets a single unread flag and one user can clear another user's unread mail.
- All state personal: uniform, but leaves permanent deletion without a coherent owner — one user's personal "delete forever" would remove the thread for everyone anyway.
- One read row per user per message: exact per-email granularity, but a row per user per message for no additional insight, since `lastReadAt` already yields per-message unread for inbound mail received after it.

**Consequences**
- `Conversation.hasUnread` is removed; unread is derived from the user's `lastReadAt` and the conversation's newest inbound message.
- A user with no state row has never read the conversation.
- Starred is a personal view over a shared conversation.
- Archiving, restoring, and permanent deletion remain team-wide.
