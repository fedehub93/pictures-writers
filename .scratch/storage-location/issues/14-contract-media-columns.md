# 14: The contract — Media loses its storage columns

**What to build:** Once production carries a stored-file record for every file, the Media stops carrying a copy of the storage facts. Its key, address, size, content type, checksum and driver disappear, and the canonical address is composed by one function from the file's key and role. Nothing about the product's behaviour changes; what disappears is the chance of two records disagreeing.

**Blocked by:** 13, 04

**Status:** ready-for-agent

- [ ] The Media no longer stores a key, an address, a size, a content type, a checksum or a driver.
- [ ] Exactly one composer produces a canonical address, and no other code builds one.
- [ ] Every read that used a Media's storage column now reads the stored-file record.
- [ ] The library, delivery, quota, audit and both backfills behave as before.
- [ ] A migration ships with the schema change, and a rolling deploy stays compatible: the old container never reads a column the new one has dropped.
- [ ] The full suite is green.

## Comments

**2026-11-21 — release A, corrected during review.** The contraction is two deploys because the
previous container reads **and writes** the columns the next migration drops. This first part makes
the code stop doing both, so that when B drops them the A container serving beside it never touches
them. It still ships one additive migration of its own.

- `Media.renditions` now records each rendition's address at write time (canonical for a local
  file, the provider's for a remote one), and `library/media-address.ts` is the projection every
  reader uses: it composes `url` with `mediaDeliveryAddress` and strips the composer's inputs from
  returned rows. There is no fallback to a Media column: `Media.url` is read only by the one-time
  backfill, at boot, before the server serves.
- `lib/file-path.ts` is the path composer and `composeMediaAddress` is the one builder of the
  `/media/<key>?mt=` address; the sweep's content address calls the same function, so no second
  shape exists. `mediaPath` is gone.
- Delivery reads the record for an original and the Media's manifest entry for a rendition; the
  route no longer parses a token from the request or from a Media column. A Media without a record
  is a 404, and the audit reports it.
- The library, blog, shop, reviews, mails, checkout, SEO, widgets and admin pickers select through
  `mediaPresentationSelect` and map with `withMediaUrl`, so their returned shape is unchanged.
- The upload, replace, archive/restore, re-home, sweep, quota and both backfills neither read nor
  write the six storage columns. The migration `relax_media_url` makes `url` nullable so a new row
  needs only its record.
- `npm run media:backfill-manifest-urls` copies the addresses out of each existing `Media.url`
  token into `renditions`; the start script runs it before `next start` (a failure stops the
  deploy), and it is idempotent and safe to run again after the switch to catch an upload the old
  container wrote during it. The command no-ops when `Media.url` is already gone.
- Docs: `docs/media.md`, ADR-0026 and the new runbook §4bis.9 describe the two-release order and
  the dump to take before B.

Release B (drop the columns and retire the two one-time commands) is the next commit and is
deployed only after A is live and its manifest is verified on the Installation.

