# 03: Upload every Media type through the application transport

**What to build:** An admin can upload an image, a document, an audio file or a video through the same transport, with local disk active. The bytes are written by the active Storage driver, the Media records the driver that wrote it, the quota counts the real bytes, and the file is served from the site's own domain. Images keep the 4 MB limit; non-images get 16 MB. A refused upload leaves nothing behind and answers with a machine-readable reason.

**Blocked by:** 02

**Status:** done

- [x] With local active, an image within 4 MB and a document, audio file and video within 16 MB upload through the multipart transport, and each row records local as its driver.
- [x] Each uploaded file is served from the site's own domain with the correct content type; documents, audio and video answer Range requests.
- [x] Oversize, quota exceeded, unclassifiable type and duplicate each return a distinct machine-readable error.
- [x] A refused or failed upload leaves no bytes on disk and no row.
- [x] The quota counts a non-image's bytes and still counts archived Media.
- [x] The admin library accepts a non-image file and shows it as a Media with its own preview.
- [x] End-to-end tests cover upload to delivery for image, document, audio and video, on a temporary local root, with the environment still naming UploadThing.

## Comments

**2026-11-19 — landed in `86a8b18d`.**

`classifyMediaType` (`src/modules/media/lib/media-type.ts`) is now the single MIME classifier shared by the endpoint and the admin form: image, video and audio by prefix, documents by an explicit allow-list, anything else refused. The multipart handler keeps the 4 MB image limit, gives every other type 16 MB, and answers `FILE_TOO_LARGE`, `MEDIA_QUOTA_EXCEEDED`, `UNSUPPORTED_MEDIA_TYPE` and `DUPLICATE_MEDIA` as distinct machine-readable codes. `createMediaFromUpload` gained `storeUploadedObject`; when the bytes arrived through the application transport, a non-image is copied to `<slug>/<id>/1/original`, records the driver that wrote it, is counted at its real byte size, and its temporary object is removed on success and on every failure path. The legacy JSON path still records provider objects as before. The library card now previews video and audio and labels a document by its MIME subtype.

Tests: `route.test.ts` covers per-type multipart uploads, the two limits, the unclassifiable code, duplicate 409, and a non-image quota refusal with no `put`. `storage-setting.test.ts` drives upload to delivery for image, document, audio and video on a temporary local root while the environment still names UploadThing, plus content type, Range, quota bytes and archived counting. Service and quota tests cover the stored revision, temp cleanup and rollback. `media-type.test.ts` covers the classifier.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (257 pre-existing warnings), `npm run check:doc-citations` 96 docs / 0 broken, `npm run test:run` 280 files / 2520 tests passed.
