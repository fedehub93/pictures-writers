# 08: One quota for every file, with a reserve for public uploads

**What to build:** The library shows one number that describes the disk — every stored file counts, whatever its role. Inside that number a configurable reserve protects the owner from the public: when public-origin files reach the reserve, further public uploads are refused and library uploads keep working. Nothing is ever deleted automatically for budget reasons.

**Blocked by:** 03, 06

**Status:** done

- [x] The library shows used and total bytes over every stored file, archived Media included.
- [x] The same number names how much of it is public-origin.
- [x] A public upload that would pass the reserve is refused, and an admin upload at the same moment succeeds.
- [x] A refusal carries a machine-readable reason and leaves no bytes and no record.
- [x] An attachment's bytes stop counting when its owner is deleted.
- [x] The reserve is an Installation setting with a documented default, and an installation with no public forms is unaffected.

## Comments

**2026-11-20**

Landed in `af693c5d` (`feat(media): count every file against one quota with a public reserve`).

- The quota now reads every `StoredFile`, whatever its role: a Media contributes its original's
  record size plus its rendition manifest, an attachment or avatar its own bytes, and archived
  Media keep counting. A Media whose location record predates the one-time backfill still counts
  from its own columns, so deploying before the backfill cannot under-count. `getMediaQuotaStatus`
  now carries `publicBytes`, and the library meter shows `used of total`, the public-origin share
  against the reserve, and an amber notice when visitor uploads are refused.
- `Settings.publicOriginReserveMb` (migration, `@default(512)`) is the share public-origin files
  may occupy inside the quota. The pure default lives at
  `PUBLIC_ORIGIN_RESERVE_DEFAULT_MB = 512` (a tenth of the 5 GB default) and the schema, migration
  and docs name each other to keep the literal honest. `PATCH /api/settings` validates it as a
  whole number of megabytes, zero or more, and refuses a reserve above the quota; the settings
  form repeats that check and documents the default.
- Admission lives in `media-quota.ts` for every transport. A public write must fit the total and
  the reserve; an internal write is bounded by the total only. All transports take the same
  advisory lock, so a public refusal never blocks an admin upload started at the same moment. The
  pre-write check refuses before any byte reaches the driver; the locked check re-reads usage and
  a failed post-write admission deletes the object and reports a cleanup failure instead of
  leaving it silently.
- Refusals answer `PUBLIC_ORIGIN_RESERVE_EXCEEDED` with `publicBytes`, `reserveBytes` and
  `reserveMb`, or the existing `MEDIA_QUOTA_EXCEEDED` with the total figures, through the shared
  `quota-error-response.ts`. `docs/media.md`, `GLOSSARY.md` (Storage quota, Public-origin reserve)
  and ADR-0026 describe the one budget, the reserve and its default.
- The migration only adds a `NOT NULL DEFAULT` column; it carries no data transform, so the
  seeded scratch-database migration check does not apply.

Verification: `npm run test:run` — 286 files, 2614 tests passed (new coverage: one budget across
attachments, avatars and archived Media; public share and reserve figures; a public refusal with
an admin upload in the same `Promise.all` writing the only new object and record; owner deletion
returning usage to baseline; settings validation and default). `npm run typecheck` clean;
`npm run lint` 0 errors (250 pre-existing warnings); `npm run check:doc-citations` 97 docs, 0
broken; `npm run build:agent` succeeded and registered `/api/settings`, `/api/media` and
`/api/forms/[formId]/attachments`. No browser probe was run for this ticket.
