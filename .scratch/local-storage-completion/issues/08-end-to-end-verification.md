# 08: End-to-end verification on a production-like copy

**What to build:** The complete acceptance path is demonstrated against a restored copy of the existing Installation, before anything is switched in production. The 720 existing Media keep their addresses, a local upload and a local document are served from the site's own domain, replace and mixed deletion work, switching the driver in both directions breaks nothing, and the audit reports a healthy library.

**Blocked by:** 02, 03, 04, 05, 06, 07

**Status:** done

- [x] On a restored production-like database, every existing Media resolves on its unchanged address.
- [x] A local image and a local document are uploaded and served from the site's own domain with the correct headers, and the document answers a Range request.
- [x] Replace works with local active and with a Media previously written by the provider.
- [x] A mixed selection deletes without leaving bytes on either driver.
- [x] Switching the active driver from local to UploadThing and back leaves every existing Media resolving.
- [x] The audit reports zero unresolved Media and reconciles local disk bytes with accounted bytes.
- [x] A browser probe renders one page with an existing legacy image and one page with a local image.
- [x] Results and figures are recorded in the ticket comment.

## Comments

**2026-11-19 — acceptance run over `dee513cc`; no source change in this ticket.**

The restored copy was the sanitized local copy of the existing Installation's database (`pictures_writers_dev`, 720 Media: 701 on `ghhc7ejbae.ufs.sh`, 19 on `utfs.io`, all with no recorded driver — the state the spec measured), restored into a scratch `pictures_writers_verify` database on the same PostgreSQL 18 container. Sanitizing followed `scripts/sanitize-dev-dump.sql`: sessions, verification tokens, credentials and integrations were stripped before the app opened it, and only ids, aggregates and hosts appear in this comment — never keys, addresses or content. The app ran on `localhost:3100` with that database and a scratch `MEDIA_STORAGE_LOCAL_ROOT`; a probe admin was seeded into the copy. All test Media and all provider objects the run wrote were removed afterwards, the scratch database and root were dropped, and no pre-existing provider object was deleted. The baseline was taken before any write: 720 rows, and at the end every one of them still had its original address (the pre-run comparison covered `id`, `url` and `key`).

**Existing library.** 720/720 existing Media answered 200 on their unchanged absolute addresses: before any write, again at the end of the run, and in a separate read-only pass that flipped the Installation setting to `uploadthing` and then back to `local` between two full 720-row checks (720/720 under each). The `/about/` page rendered two of the `utfs.io` images (640 px and 320 px, `loading=lazy`), both complete, with no page exceptions.

**Local image and document.** Uploaded through the multipart endpoint with the Installation setting on local and the environment still naming UploadThing. The PNG (1,676 B in) was normalised to 605 B, recorded `storageDriver=local` on the row under `default/<id>/1/original`, and answered 200 with `image/png`, `Cache-Control: public, max-age=31536000, immutable`, an ETag and the stored byte length; all 16 renditions answered 200 and existed on disk. The 200-byte PDF recorded `storageDriver=local` and `type=FILE`, answered 200 with `application/pdf` and the exact bytes, and `Range: bytes=2-9` answered 206 with `Content-Range: bytes 2-9/200`. Both files serve through the same local branch of the delivery route, which sets `Content-Type`, `ETag`, `Cache-Control` and `Accept-Ranges`; the image assertions covered that header set and the document assertions covered type, length and Range.

**Replace.** With local active, replace moved the image to revision 2 (`default/<id>/2/original`), reported `previousRevisionCleanup=removed` and the previous revision file was gone; a refused replace (415, unclassifiable type) left revision 2, its key and its address intact. For the cross-driver case the setting was moved to UploadThing, a fresh image was uploaded through the same transport (`storageDriver=uploadthing`, provider object answering 200), the setting was moved back to local, and that Media was replaced: revision 2 recorded local, cleanup rendered `removed`, the provider index no longer resolves the old customId, and the new revision serves from disk. The old CDN address still answered from cache — the provider index, not a warm CDN URL, is what showed the object gone.

**Driver switches.** local → UploadThing → local: the local Media answered 200 under all three settings, and the outside setting was then left in place for a full 720/720 pass; the same 720 answered 720/720 with local restored (the read-only flip described under "Existing library").

**Mixed deletion.** A fresh provider-written Media and a fresh local Media were uploaded for the batch, archived, and removed through `media.removeMany`: `deleted=2`, both cleanup entries `removed`, the local revision directory went from 15,493 bytes to 0, and the provider object no longer resolves in the UploadThing index. The old provider URL was not probed, for the same CDN-cache reason; the index is the check. A final `listFiles` pass over the provider account found zero objects carrying this Installation's namespaced `default/` customId, so the run left nothing behind.

**Audit.** `npm run media:audit` ran after the mixed deletion (and again after the browser probes, with the same output), against the scratch database and root. Four local Media existed at the deletion's peak; the batch removed the fresh local Media and the fresh provider-written one, so the three local Media the audit counts are the ones the run kept: the replaced image, the document, and the provider-written Media replaced onto local. Both deleted test rows are gone from the database, and the volume holds exactly what remains.

```
media: 723
drivers: local=3 unrecorded=720
unconfigured drivers: none
bytes: accounted=377135934 localAccounted=31781 localOnDisk=31781 localDifference=0
objects: accounted=35 onDisk=35 missing=0 orphaned=0
unresolved: 0
```

Exit code 0. The 35 objects are 17 + 1 + 17 for those three Media (two images with 16 renditions each plus one document). `accounted` covers every original plus every rendition in the manifest, so it is far above the spec's ~84 MB of originals: the 720 legacy images contribute their stored manifests, and `localAccounted` is the part the local rows own.

**Browser probe.** `scripts/browser-probe.mjs`'s `withSession` opened both pages and reported the images' hosts, paths and `naturalWidth`; only hosts and path shapes are printed, never addresses. `/about/` (an existing published page) rendered two legacy `utfs.io` images, both loaded. A probe page seeded into the copy rendered one image with host `localhost:3100` and path `/media/<key>`, loaded at 327 px, with no page exceptions.

Scope note: the media-volume backup and restore drill stays with ticket 01 (still `ready-for-human`), and the documentation changes stay with ticket 09; this ticket records the database-and-disk acceptance path. The no-provider fresh-installation path (spec story 28) is not part of this ticket's checklist and was not re-run here.

Commits: this ticket file only. `npm run check:doc-citations` passes (96 docs, 0 broken). Lint, typecheck and the test suite were not rerun because no source changed; the acceptance run exercised the routes and the audit command the previous tickets landed.

