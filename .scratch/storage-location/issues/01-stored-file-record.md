# 01: A stored file record exists for every file

**What to build:** Every file the Installation owns gets one record of where its bytes are. New uploads create it alongside the Media they produce; the 720 Media already in the library get theirs from a one-time command that reads what the library already knows. The Media keeps working exactly as before, so a visitor and an admin see no difference. From here on, "where are the bytes of this file" has one answer in one place.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] A new upload creates one stored-file record carrying its storage key, driver, content type, size and checksum.
- [ ] The one-time command creates exactly one record per existing Media, and running it twice creates no duplicate.
- [ ] For an existing Media whose address is absolute, the record carries that address as its remote location; a local one carries none.
- [ ] A Media with no readable storage key is reported by the command and skipped, never silently lost.
- [ ] The library, delivery, quota and audit behave exactly as before the change.
- [ ] The command is read-only in the sense that it changes no existing Media row.
