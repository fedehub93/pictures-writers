# 06: Off-peak rendition backfill for existing media

**What to build:** A manually run job that generates renditions for the 674 images already in the library, with bounded concurrency, a dry-run mode, a report of what it did and what it skipped, and idempotency so it can be re-run safely. Unreachable sources are reported and skipped without stopping the run. Until the job reaches an image, that image keeps being served as its original.

**Blocked by:** 03

**Status:** done

- [x] The job generates missing renditions for every reachable image Media and reports each skipped source with a reason.
- [x] Running the job twice produces no duplicate objects and no errors on already-processed Media.
- [x] Concurrency is bounded so the job does not starve the database or the application on a 4 vCPU host.
- [x] Dry-run lists the pending work without writing to storage or the database.
- [x] After a completed run, historic images are delivered as renditions, and any image still pending falls back to its original.
- [x] The operator documentation explains when and how to run the job, and how to read its report.

## Notes

- `src/modules/media/server/backfill-media-renditions.ts` selects image Media without a rendition manifest, reads the source through the storage driver (legacy rows derive the key from their URL), normalises it once, writes `<mediaId>/<revision>/original` plus the full ladder under `<mediaId>/<revision>/`, and updates `key`, `url`, `size`, `mimeType`, `checksum`, `metadata` and `renditions`. Rows with a manifest are skipped, so the job is idempotent.
- The write reuses the same `writeImageVersion` seam as upload, exported from `media-service.ts`. The backfill disables prefix rollback when the source already lives under the Media prefix, because deleting it would remove the object the Media is currently delivered from.
- The legacy source object is deliberately never deleted: absolute URLs embedded in Puck, TipTap, ad and email content still point at it. Only the library URL learns the rendition token.
- Bounded concurrency moved to `src/modules/media/server/concurrency.ts` and is shared with the metadata backfill. The rendition default is 2 (image processing is CPU-bound); `MEDIA_RENDITION_BACKFILL_CONCURRENCY` overrides it.
- Archived images are processed with an archived delivery token, so they keep serving their original until `restoreMedia` toggles the token back and enables renditions.
- Unreachable or undecodable sources land in `failed` with a reason and the run continues. Objects written for a source that fails are rolled back when the revision prefix was empty; an original already in delivery is never deleted, so a retry simply overwrites orphaned renditions.
- Run with `npm run media:backfill-renditions` (add `MEDIA_BACKFILL_DRY_RUN=1` for the preview). Operator docs are in `docs/self-hosting/08-operations-runbook.md` §4bis.3 and `appendice-c-comandi.md` §6bis.
- Tests: `backfill-media-renditions.test.ts` covers full ladder + loader resolution, legacy source retention, double run, dry-run, unreachable and undecodable sources, archived/restored delivery, bounded concurrency and non-image exclusion.
