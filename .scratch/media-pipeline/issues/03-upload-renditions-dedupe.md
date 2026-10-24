# 03: Upload generates renditions, duplicate warnings

**What to build:** Creating a Media from an uploaded image downloads the original once, normalises it (orientation, EXIF stripped, bounded long edge), computes its metadata and checksum, generates the full rendition ladder in AVIF and WebP, uploads them and records the manifest. If the checksum already exists the admin is offered "use the existing one" or an explicit "upload anyway". A failed processing leaves no Media behind.

**Blocked by:** 02

**Status:** done

- [x] Uploading an image produces the original plus AVIF and WebP renditions for every ladder width, and the manifest describes exactly the objects that exist.
- [x] A newly uploaded image is immediately delivered as a rendition at the width the viewport asks for, with no image CPU spent by the server.
- [x] A duplicate checksum returns the existing Media and the UI offers using it or overriding; overriding creates a second row with its own storage keys.
- [x] A processing failure creates no Media row and reports the failure to the admin.
- [x] Uploading a PDF, audio or video file creates no renditions and keeps working exactly as before.
- [x] Renditions are only generated once per upload; serving the image afterwards never regenerates them.

## Notes

- `src/modules/media/server/process-image.ts` normalises the uploaded bytes (orientation applied, EXIF dropped, long edge capped at 1920) and cuts every ladder width in AVIF and WebP. `image-bytes.ts` holds the shared checksum and blur helpers used by both the processor and the metadata backfill.
- `src/modules/media/server/media-service.ts` owns the upload transaction: read the source once, hash it, check for a duplicate, write `<mediaId>/<revision>/original` and `<mediaId>/<revision>/<width>.<format>`, then create the row with `key`, `url`, `mimeType`, `size`, `checksum`, `metadata` and `renditions`. Any failure deletes the `<mediaId>/` prefix and throws `MediaProcessingError`; the row is created last, so a dropped request never leaves a half-processed Media.
- `Media.url` is written with `buildMediaDeliveryUrl`, so the loader resolves renditions immediately and delivery stays CPU-free. The loader now also accepts a delivery token on a relative URL (needed by the local driver in tests); absolute third-party URLs still pass through untouched even if they carry a stray token.
- `POST /api/media` routes images through the service and everything else through the historical plain-row path. It answers `409 { duplicate: true, media }` for a checksum hit and `422` when processing fails.
- The create-media modal detects image vs file from the uploaded MIME, keeps the type select controlled, and shows a duplicate dialog with "Use existing" (calls the modal callback) and "Upload anyway" (re-submits with `override: true`).
- The source object is deleted best-effort after a successful processing. Objects uploaded through the legacy UploadThing file-key flow (everything the current client sends) cannot be addressed by `customId`, so those raw uploads stay behind; the upload budget still has ample headroom. A dedicated cleanup pass can remove them once the upload mechanism writes through the storage seam.
- Ladder widths are generated even when the normalised source is narrower (matching the ticket's "every ladder width" and Next's own upscaling semantics). The original itself is never enlarged.
- Tests: `media-service.test.ts` (storage + DB integration), `route.test.ts` (admin-facing conflict/failure contract), `image-loader.test.ts` (relative and third-party token handling).
