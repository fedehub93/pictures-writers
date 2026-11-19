# 02: Delivery resolves the storage location

**What to build:** The public address of a file resolves through its stored-file record instead of through the Media's own columns. A local file streams from disk with content type, ETag, cache headers and Range support; a remote file is a plain redirect to the location it records. The provider hop stops requiring a provider API call and stops being cached as if it were the file, so a later move cannot leave a visitor chasing a deleted object.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] An image and a document on local disk answer on `/media/<key>` with the right content type, byte length and Range support.
- [ ] A remote file answers with a redirect to its recorded location.
- [ ] The redirect carries a short cache and is never marked immutable; a 200 response keeps the immutable cache.
- [ ] A remote redirect performs no provider read.
- [ ] A Media with no recorded driver still resolves, using its remote location.
- [ ] A rendition resolves through its Media's file without a record of its own.
- [ ] A key that parses but does not belong to the addressed file is a 404, not a stream.
- [ ] A missing file answers 404 and never a stack trace.
