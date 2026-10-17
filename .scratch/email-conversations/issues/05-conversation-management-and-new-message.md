# 05: Conversation management and new message

**What to build:** A user can start a brand-new one-to-one conversation to any email address, archive a conversation, soft-delete a conversation, and create a `Contact` from an unknown sender with one click.

**Blocked by:** 04 Reply composer and one-to-one send

**Status:** ready-for-agent

- [ ] “New message” UI lets the user pick an allowed account, enter a recipient address, subject, body, and attachments, and send.
- [ ] Sending a new message creates a `Conversation` and an outbound `EmailMessage`; if the recipient is not a `Contact`, no contact is auto-created.
- [ ] Archive action sets `archivedAt`; archived conversations can be filtered separately or hidden from the main inbox.
- [ ] Delete action sets `deletedAt` (soft delete); a future trash view can later show these.
- [ ] “Create contact” action on a conversation creates a `Contact` from the conversation’s `contactEmail` and `contactName` and links the conversation to it.
- [ ] Tests verify new-message flow, archive/soft-delete, and manual contact creation.
