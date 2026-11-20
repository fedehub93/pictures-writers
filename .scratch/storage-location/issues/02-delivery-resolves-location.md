# 02: Delivery resolves the storage location

**What to build:** The public address of a file resolves through its stored-file record instead of through the Media's own columns. A local file streams from disk with content type, ETag, cache headers and Range support; a remote file is a plain redirect to the location it records. The provider hop stops requiring a provider API call and stops being cached as if it were the file, so a later move cannot leave a visitor chasing a deleted object.

**Blocked by:** 01

**Status:** done

- [x] An image and a document on local disk answer on `/media/<key>` with the right content type, byte length and Range support.
- [x] A remote file answers with a redirect to its recorded location.
- [x] The redirect carries a short cache and is never marked immutable; a 200 response keeps the immutable cache.
- [x] A remote redirect performs no provider read.
- [x] A Media with no recorded driver still resolves, using its remote location.
- [x] A rendition resolves through its Media's file without a record of its own.
- [x] A key that parses but does not belong to the addressed file is a 404, not a stream.
- [x] A missing file answers 404 and never a stack trace.

## Comments

**2026-11-19**

Landed in `7858d320` (`feat(media): serve files from their recorded location`), with review
follow-ups in `d041b7e7` (`fix(media): keep delivery on the file's recorded location`) and
`051d782a` (`docs(media): describe delivery from the stored-file record`).

- Delivery looks up the `StoredFile` by key first: its driver, remote address and content type
  are the answer. A Media whose record predates the backfill still resolves from its own key and
  address, so this code can deploy before the one-time command without darkening an image.
- A local file streams from the volume with the recorded content type, an ETag, the immutable
  cache, `Content-Length` (on `HEAD` too) and Range/206 support. A document keeps its exact bytes.
- A remote file answers `302` to its recorded `remoteUrl` with `Cache-Control: public,
  max-age=300`, never `immutable`; a `200` keeps the immutable cache. The hop builds no driver and
  performs no provider API call.
- A rendition has no record of its own: delivery resolves the owner from the parsed key and
  requires the requested key under the owner's stored-file revision prefix. A remote rendition
  takes its address from the Media's `?mt=` manifest without a provider read. A manifest with no
  address, or one that points back at `/media/`, answers 404 instead of redirecting to itself.
- `docs/media.md` and ADR-0026 record the stored-file delivery contract, the short redirect cache
  and the rendition resolution; the wider "mixed library" wording is left to the later ADR pass.

Verification: `npm run test:run` — 284 files, 2572 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (257 pre-existing warnings); `npm run check:doc-citations` 0 broken.
