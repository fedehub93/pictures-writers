# 01: Upload and serve a Media with the local driver

**What to build:** A fresh Installation with the local storage driver and no provider account can upload an image through the application and see it served from its own domain. The browser posts the file to the application as multipart form data, the application writes it through the active storage driver, a Media row records a relative namespaced key and the `local` driver, and `GET /media/<key>` streams the bytes back with the right content type, a cache policy that allows `immutable`, and support for seeking on non-image files. A failure after the bytes are written removes them. The whole chain is verifiable over HTTP, with no interview in the middle.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A multipart upload of an image returns a Media whose `url` is the relative path `/media/<key>` and carries no domain.
- [x] The stored `key` follows `<installationSlug>/<mediaId>/<revision>/original`, and generated renditions follow the same prefix.
- [x] `GET` of that URL returns the same bytes, the object's content type, an ETag derived from the key, and `Cache-Control: public, max-age=31536000, immutable`.
- [x] `Range` requests on a non-image return partial content; `HEAD` returns the same headers with no body.
- [x] An unknown key answers 404, and a key containing `..`, a backslash, a null byte or an absolute path answers 404 without reaching the driver.
- [x] The media service receives bytes it can read back rather than a provider URL, and processes them exactly as it does today (metadata, checksum, rendition ladder, duplicate detection).
- [x] Each Media records the storage driver that wrote it, and delivery resolves the driver by looking up the row from the key rather than from one process-wide setting.
- [x] A Media row created before this change, carrying no driver, resolves as remote.
- [x] An upload that fails during processing leaves no Media row and no object in storage.
- [x] The delivery route, the upload endpoint and the media service obtain the driver from a resolver rather than capturing it at module load.
- [x] The driver contract suite still passes against both drivers, and the delivery, upload and key-layout behaviours are covered at the HTTP seam.

## Comments

**2026-11-18** — Closed by `11ec7644`. Added the `POST /api/media` multipart handler, the `GET /media/<key>` delivery route, the local storage driver wiring, and the `Media.storageDriver` column. The media service now reads uploaded bytes back from the active driver instead of treating the upload as a remote URL. Verification: `npm run typecheck` clean, `npm run lint` 0 errors, `npm run check:doc-citations` 0 broken, `npm run test:run` 272 test files / 2413 tests passed.

**2026-11-18 (follow-up)** — `e207f68e` makes the backfill key extractor understand canonical `/media/<key>` URLs; `893fa68f` connects the media library create modal to the multipart endpoint so uploads no longer go through UploadThing. Full suite re-run: 272 test files / 2418 tests passed.
