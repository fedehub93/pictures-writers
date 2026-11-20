# 04: Replace a file through the active driver and the application transport

**What to build:** "Replace file" behaves like the upload the admin chose: it takes its bytes through the application transport, writes the new revision through the active driver — not the environment's — and leaves the previous revision intact when it fails. The previous object is cleaned through the driver recorded on the existing Media, and a provider that is not configured never blocks the replace.

**Blocked by:** 03

**Status:** done

- [x] With the Installation setting on local and the environment still naming UploadThing, replace writes the new revision to disk and the Media records local.
- [x] With the setting on UploadThing, replace writes to the provider.
- [x] The replace flow no longer uses the UploadThing dropzone; it posts through the application's upload transport.
- [x] Cleanup of the previous revision resolves the driver recorded on the existing Media.
- [x] When the previous provider is not configured, replace still succeeds and reports the cleanup as skipped.
- [x] A failed replace leaves the previous revision, address and manifest intact.
- [x] Tests cover both drivers and a Media written by the other driver.

## Comments

**2026-11-19 — landed in `7ce4f015`.**

`POST /api/media/[mediaId]/replace` now accepts the same `multipart/form-data` transport as `/api/media`: `checkUploadFile` applies the shared 4 MB / 16 MB limits and the machine-readable refusals, the bytes are written under a temporary key through the active driver, and `replaceMediaFile` deletes that temporary object on every outcome through a single `finally`. The active driver comes from `resolveActiveStorageDriver` (Installation setting first, environment second), so the replace follows the choice made in the library, not the environment. The admin modal uses a file input and posts `FormData`; the UploadThing `FileUpload` dropzone is gone from the flow.

`replaceMediaFile` now returns `{ media, previousRevisionCleanup }`. Cleanup resolves the driver recorded on the row (`null` means remote, as delivery already assumes), and `isStorageDriverConfigured` makes an unconfigured provider report `"skipped"` instead of failing. The prefix of the superseded revision comes from `mediaKeyDirectory` in `media-key.ts`, not from segment counting in the service, and the installation slug resolved once is passed into the revision writers so a injected environment cannot make rollback delete a different prefix. The UploadThing driver falls back to `keyType: "fileKey"` when a customId delete finds nothing, so a replaced pre-seam object is actually removed rather than reported as cleaned.

Tests: the replace route suite covers the multipart flow, the refusal of a bare provider key, 415/413/400, 404 with temp cleanup, 422 and quota failures leaving key/url/renditions intact, and skipped cleanup with no token. `storage-setting.test.ts` replaces on disk while the environment still names UploadThing; `storage-setting-remote.test.ts` covers remote replace, both cross-driver directions, and a legacy provider object deleted by file key. Service and driver suites cover the recorded-driver cleanup, the skipped report, and the fileKey fallback.

Review findings addressed: cleanup no longer reports success for a legacy object it cannot address; key grammar stays in `media-key.ts`; the slug used by the revision writers and the rollback prefix is the same; `types.ts` owns the shared cleanup status. `docs/media.md` gained `isStorageDriverConfigured` to the driver wiring list.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (257 pre-existing warnings), `npm run check:doc-citations` 96 docs / 0 broken, `npm run test:run` 280 files / 2531 tests passed, `npm run build:agent` succeeded.

