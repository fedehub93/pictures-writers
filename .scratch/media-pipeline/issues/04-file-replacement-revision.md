# 04: Replace a file inside an existing Media

**What to build:** The admin can replace the file of an existing Media. The Media's revision is bumped, the original and all renditions are written under new storage keys, and the previous prefix is deleted. Every post, page, product, Puck block and rich-text reference keeps pointing at the same Media, and the old bytes stop being served immediately.

**Blocked by:** 03

**Status:** done

- [x] Replacing a file bumps the revision, writes new keys for original and renditions, and removes the previous revision's prefix.
- [x] Content references are unchanged by a replacement.
- [x] No URL serves the previous bytes after a successful replacement.
- [x] A replacement that fails midway leaves the previous revision intact and still delivered.
- [x] Replacing a non-image file updates the bytes and metadata without generating renditions.

## Notes

- `replaceMediaFile` in `src/modules/media/server/media-service.ts` reads the replacement once, writes `<mediaId>/<revision+1>/original` plus the full rendition ladder for images (or only the original for other types), then updates the existing row. Content relations and JSON snapshots are never touched; a replacement keeps the Media's type, name and alt text, so `VIDEO`/`AUDIO`/`FILE` stay what they were.
- Ordering is "write the new revision, update the row, delete the old prefix". Any failure before the update deletes only the new prefix and throws `MediaProcessingError`; the previous revision and its delivery URL stay intact.
- Images reuse the upload processor (`writeImageVersion`), so revision bumps get the same normalisation, manifest and delivery token as a first upload. Non-images keep the bytes intact, update `size`/`mimeType`/`checksum`, clear `metadata`/`renditions` and generate no derived objects.
- Legacy Media whose original lived at an upload key rather than under `<mediaId>/` also get that key removed best-effort, so old URLs stop serving after a successful replacement. Legacy UploadThing file keys that the seam cannot address are left behind, as on upload.
- `POST /api/media/[mediaId]/replace` exposes the operation to the admin (`404` unknown Media, `422` processing failure, `400` missing file). The media library card has a "Replace" action backed by `replace-media-modal.tsx`.
- Tests: `media-service.test.ts` covers new keys/manifest, previous-prefix removal, unchanged identity and a live `Seo` relation, failure isolation, unknown Media and non-image replacement; `replace/route.test.ts` covers 200/400/404/422.
