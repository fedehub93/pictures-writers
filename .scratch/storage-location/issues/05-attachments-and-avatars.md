# 05: Attachments and avatars on the Installation's own domain

**What to build:** An admin can attach a file to an email reply and set a user's avatar without a provider account. Both are stored as files with a role that records who owns them, and both are served from the Installation's own domain under `/files/<key>`. They never appear in the media library, and they die with the message or the user that owns them.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] With no provider token configured, attaching a file to an email reply succeeds and the file opens from the Installation's domain.
- [ ] With no provider token configured, setting an avatar succeeds and the image renders in the admin and on the account.
- [ ] An attachment and an avatar answer with the right content type and cache headers.
- [ ] An attachment does not appear in the library, cannot be selected as content, and has no renditions.
- [ ] Deleting the message or the user removes the owned file's objects through the recorded driver.
- [ ] A file owned by a message or a submission cannot be deleted from any library action.
- [ ] An attachment or avatar whose driver is not configured here is reported, not lost.
