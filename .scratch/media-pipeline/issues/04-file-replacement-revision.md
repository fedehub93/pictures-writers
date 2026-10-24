# 04: Replace a file inside an existing Media

**What to build:** The admin can replace the file of an existing Media. The Media's revision is bumped, the original and all renditions are written under new storage keys, and the previous prefix is deleted. Every post, page, product, Puck block and rich-text reference keeps pointing at the same Media, and the old bytes stop being served immediately.

**Blocked by:** 03

**Status:** ready-for-agent

- [ ] Replacing a file bumps the revision, writes new keys for original and renditions, and removes the previous revision's prefix.
- [ ] Content references are unchanged by a replacement.
- [ ] No URL serves the previous bytes after a successful replacement.
- [ ] A replacement that fails midway leaves the previous revision intact and still delivered.
- [ ] Replacing a non-image file updates the bytes and metadata without generating renditions.
