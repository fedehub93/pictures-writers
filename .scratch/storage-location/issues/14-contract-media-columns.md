# 14: The contract — Media loses its storage columns

**What to build:** Once production carries a stored-file record for every file, the Media stops carrying a copy of the storage facts. Its key, address, size, content type, checksum and driver disappear, and the canonical address is composed by one function from the file's key and role. Nothing about the product's behaviour changes; what disappears is the chance of two records disagreeing.

**Blocked by:** 13, 04

**Status:** done

- [x] The Media no longer stores a key, an address, a size, a content type, a checksum or a driver.
- [x] Exactly one composer produces a canonical address, and no other code builds one.
- [x] Every read that used a Media's storage column now reads the stored-file record.
- [x] The library, delivery, quota, audit and both backfills behave as before.
- [x] A migration ships with the schema change, and a rolling deploy stays compatible: the old container never reads a column the new one has dropped.
- [x] The full suite is green.

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

**2026-11-21 — release B, landed in `72c4c72b`.** On top of A (`723d7e57`) the contraction is
complete; the production deploy order stays the one in runbook §4bis.9 and has not been run from
this session.

- Migration `20261121160000_contract_media_columns` drops `key`, `url`, `size`, `mimeType`,
  `checksum` and `storageDriver`, in that column list, and the Prisma model matches. Nothing else
  in the schema changed: `name`, `type`, `altText`, `revision`, `metadata`, `renditions` and
  `archivedAt` stay, as does the `StoredFile` relation.
- Retired with the columns: `media:backfill-files` and `media:backfill-manifest-urls` (scripts,
  server modules and their suites), `remoteUrlForAddress`, `mediaSourceKey`, and the start
  script's pre-`next start` manifest step. The metadata and rendition backfills remain and still
  read the stored-file record.
- The library, delivery, quota, audit, upload, replace, archive/restore, re-home and sweep were
  already on the record and the manifest after A, so this release changes no behaviour; it removes
  the copy that could disagree. `storedFilePath` and `mediaDeliveryAddress` are still the only
  builders of an address.
- Docs: ADR-0026 records the contraction as a second deploy, `docs/media.md` describes the Media
  without storage columns and the retired commands, runbook §4bis.8 marks the location backfill as
  retired and §4bis.9 names A (`723d7e57`) and B (this commit), and the self-hosting checklist
  records the manifests step as done once.
- Verification: `npm run lint` 0 errors (251 pre-existing warnings), `npm run typecheck` clean,
  `npm run check:doc-citations` 97 docs / 0 broken, `npm run test:run` 293 files / 2653 tests
  passed, `npm run build:agent` green. The migration was exercised per
  `docs/agents/migration-check.md` on a scratch database: a pre-contract `Media` row (key, url,
  size, mimeType, checksum, storageDriver, metadata and renditions) plus its `StoredFile` were
  seeded, the migration applied, and the assertion confirmed the six columns gone while metadata,
  renditions and the stored-file link survived. The agent database had recorded the contraction
  before the relax migration, so its bookkeeping needed `prisma migrate resolve --applied
  20261121150000_relax_media_url`; no data was reset.
- Still operational, not code: release A must be live and its manifest verified, then a dump is
  taken before B. That sequence and the post-B checks are §4bis.9.

**2026-11-21 — review follow-up in `0f33a0f3`.** The two-axis review of `67d06023...HEAD` found
the reader shapes had drifted: a caller that used to select `url` alone (checkout, mail, the
by-ids and list queries) was selecting the card projection and returning `id`, `altText` and the
metadata JSON as well. Those readers now select the address-only projection plus exactly the
fields they returned before, so "the returned shape is unchanged" holds. The same review found
three guides still promising the re-home's `address-not-canonical` refusal, which no longer has an
address to inspect: `docs/media.md`, the glossary and ADR-0026 now state that sweep-before-move is
an operating rule, and runbook §4bis.9 adds the post-A remedy for a Media the release-13 container
inserts without a record (re-run `media:backfill-files` while A is live, before the dump). The
empty URL a record-less Media gets in the library (`mediaDeliveryAddress` returns `""`) is
recorded as a known follow-up: it is the audit's row, not a render path the gate expects to hit.
Verification unchanged: typecheck clean, lint 0 errors, doc citations 97/0, full suite 293 files /
2653 tests, `build:agent` green.

