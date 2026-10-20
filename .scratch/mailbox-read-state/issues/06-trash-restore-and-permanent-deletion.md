# 06: Trash restore and permanent deletion

**What to build:** From the Trash view a user can restore a conversation to the Inbox or permanently delete it, with the same shared-triage semantics as archive.

**Blocked by:** 05 Mailbox views and navigation

**Status:** resolved

- [x] `conversations.restore({ id })` clears `deletedAt`, returning the conversation to the Inbox (or Archive if it was archived).
- [x] `conversations.deleteForever({ id })` hard-deletes the conversation, cascading messages and attachments.
- [x] Permanent deletion attempts to remove stored attachment files best-effort; a storage failure does not block the database deletion.
- [x] Permanent deletion requires an explicit confirmation dialog naming the conversation.
- [x] Both actions are available only from the Trash view and are gated by `mail.read` plus account access.
- [x] `remove` keeps working from Inbox and Archive as the soft delete that feeds Trash.
- [x] Tests: restore returns the conversation to the expected view, permanent deletion removes rows and attempts storage cleanup, and inaccessible conversations are rejected as missing.

## Comments

- `restore` and `deleteForever` only accept conversations that are currently trashed. Both scope the lookup by account permission and return `NOT_FOUND` for unknown, active or inaccessible threads, so the API does not leak their existence.
- `restore` clears `deletedAt` and leaves `archivedAt` alone, so an archived thread returns to Archive and every other thread returns to the Inbox.
- `deleteForever` re-checks `deletedAt` in the delete statement, so a conversation restored concurrently is not destroyed. Message and attachment rows cascade with the conversation.
- Attachment URLs are collected before the delete and removed afterwards through the `AttachmentStorage` seam. UploadThing keys are derived from `*.ufs.sh` / `utfs.io` URLs; foreign URLs are skipped, and any storage failure is logged without blocking the deletion.
- Trash rows no longer use the read/star menu. They render `ConversationTrashMenu` with Restore and Delete forever; the destructive action opens an `AlertDialog` naming the conversation.
- `useRestoreConversation` and `useDeleteConversationForever` share the lifecycle invalidation used by `remove`: drop the cached detail, then invalidate lists, counts and Sent.
- Tests: restore to Inbox and Archive, active/inaccessible rejection as missing, hard-delete plus cascade, storage cleanup call, storage-failure tolerance, UploadThing key extraction, and Trash row/confirmation rendering.
- Verification: `npx tsc --noEmit` clean; ESLint on the module clean; full Vitest suite 148 files / 1275 tests green.
