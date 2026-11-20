# 05: Attachments and avatars on the Installation's own domain

**What to build:** An admin can attach a file to an email reply and set a user's avatar without a provider account. Both are stored as files with a role that records who owns them, and both are served from the Installation's own domain under `/files/<key>`. They never appear in the media library, and they die with the message or the user that owns them.

**Blocked by:** 04

**Status:** done

- [x] With no provider token configured, attaching a file to an email reply succeeds and the file opens from the Installation's domain.
- [x] With no provider token configured, setting an avatar succeeds and the image renders in the admin and on the account.
- [x] An attachment and an avatar answer with the right content type and cache headers.
- [x] An attachment does not appear in the library, cannot be selected as content, and has no renditions.
- [x] Deleting the message or the user removes the owned file's objects through the recorded driver.
- [x] A file owned by a message or a submission cannot be deleted from any library action.
- [x] An attachment or avatar whose driver is not configured here is reported, not lost.

## Comments

**2026-11-20**

Landed in `0b8aaf2a` (`feat(media): store attachments and avatars as owned files`).

- The role is now `Attachment`: exactly one owner (an `EmailMessage` or a
  `FormSubmission`), the original filename and the external provider id, and a
  one-to-one reference to its `StoredFile`. `StoredFile` gained the avatar owner
  (`avatarOwnerId`, `SetNull` so a failed cleanup leaves the record for the
  audit) and the attachment back-relation. The migration creates the new table
  and copies legacy `EmailAttachment` rows: an UploadThing address keeps the
  provider's own file key so a later deletion still removes the exact object, a
  `/files/<key>` address keeps its key, and any other address is recorded as an
  `external` remote location the audit reports instead of guessing. The old
  table is deliberately left in place for a rolling deploy.
- `POST /api/files/attachments` and `POST /api/files/avatars` share one admin
  transport. Both write through the active driver, compute and record the
  checksum, and answer with the canonical `/files/<key>` address. The composer
  uploads there instead of UploadThing and hands the send use-case a stored-file
  id; the use-case proves the record is an unclaimed `ATTACHMENT`, makes its
  address absolute with the Installation URL for the provider to fetch, and
  creates the role with the message. The admin user editor uploads an avatar the
  same way and the user update claims it by its canonical address, releasing the
  previous file.
- Delivery is `GET /files/<key>`: the stored-file record decides the driver, a
  local file streams with the recorded content type, ETag, immutable cache,
  Range and `HEAD`, and a remote file is a `302` with `max-age=300` and never
  `immutable`. `Content-Security-Policy: sandbox` and `nosniff` keep an
  arbitrary attachment type from running script on this origin. The loop guard
  is per prefix, so an old attachment whose address is still `/media/<key>` can
  redirect there.
- A `/files` key is a 404 under `/media/` and vice versa, and the media library
  only ever sees `Media` rows, so an attachment cannot be listed, picked or
  deleted by a library action. The library deletion path rejects a stored-file
  id as an unknown Media and leaves the record and bytes untouched.
- Cleanup resolves each file's recorded driver. The record is deleted inside the
  same transaction as the object, so a role foreign key refuses it before any
  bytes are touched, and a driver that cannot be reached leaves the record in
  place and is logged; the audit reports it. A conversation's deletion cleans
  its attachment objects; replacing or clearing an avatar cleans the previous
  one; both auth configurations call the same helper from the user-delete hook.
- Inbound email attachments were moved onto the same writer because the schema
  change removed `EmailAttachment`; the additional 07 acceptance criteria
  (multiple attachments, failure isolation) stay with ticket 07 and are not
  claimed here.

Tests: a new end-to-end suite covers upload → send → `/files` delivery with
content type, ETag, immutable cache, Range and HEAD; media-library invisibility
and refusal of a library delete; conversation deletion removing the object,
record and role; avatar upload, claim, render address, replacement cleanup and
user-avatar cleanup; remote redirects with a five-minute cache; and the audit
reporting an unconfigured driver. The migration's row transform was run against
a scratch database with UploadThing, canonical `/files` and other relative
legacy addresses.

The user-delete path itself is not exercised end to end: this branch has no
admin user-deletion route, and Better Auth's self-service deletion is disabled.
The test exercises the helper that both auth configurations call from the
user-delete hook. Uploads never claimed (a cancelled composer or user dialog)
are not garbage-collected; that was true of the provider path too and the bytes
will count against the budget ticket 08 introduces.

Verification: `npm run test:run` — 284 files, 2589 tests passed;
`npm run typecheck` clean; `npm run lint` 0 errors (257 pre-existing warnings);
`npm run check:doc-citations` 96 docs / 0 broken. No browser probe was run for
this ticket.
