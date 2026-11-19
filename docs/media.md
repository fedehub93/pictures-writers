# Media: how a file is stored, addressed and served

This is the map of the media module, not a spec. The decisions are in
`docs/adr/0026-media-storage-seam-and-pregenerated-renditions.md`; the requirements and the
ticket history are in `.scratch/media-urls-and-uploads/spec.md` and
`.scratch/local-storage-completion/spec.md`.

Read this before changing anything under `src/modules/media/`, `src/app/media/` or
`src/app/api/media/`.

## The two paths

```
upload    browser -> POST /api/media (multipart)
          -> createMediaFromUpload
          -> active storage driver
          -> Media row: key, url, storageDriver

deliver   GET /media/<key>
          -> findDeliveryMedia
          -> driverForStorageDriver(row.storageDriver)
          -> local: stream from disk | remote: 302 to the CDN
```

The active driver decides where **new** uploads go. Delivery never asks the active driver: it
asks the row, so switching storage affects only new files. The metadata and rendition backfills
resolve the recorded driver per row for reads and writes, so a library that mixes legacy provider
Media and local Media is processed in one run; a row whose driver is not configured here is
reported and the run continues.

A mixed library is the expected state on this Installation, not an edge case: the Media that
predate the seam stay on UploadThing, and a Media uploaded with the local driver active goes to
disk. Deletion, both backfills and the audit resolve the driver per row; no batch operation may
resolve one driver for a whole selection.

Every Media type enters through the same multipart transport. An image is normalised and cut
into the rendition ladder; a document, audio file or video is copied untouched to
`<revision>/original` and has no renditions. `classifyMediaType` decides the kind from the MIME
type: images keep the 4 MB transport limit, every other type gets 16 MB, and a type it cannot
classify is refused before any byte is written. The legacy JSON upload path still records a
provider object as it arrives and leaves the row without a recorded driver; only the multipart
path writes under the Media's own revision.

## Where things live

| Concern | File |
| --- | --- |
| Upload, replace, archive, delete, revisions | `src/modules/media/server/media-service.ts` |
| Metadata and rendition backfills | `src/modules/media/server/backfill-media-metadata.ts`, `src/modules/media/server/backfill-media-renditions.ts` |
| Key grammar: compose, parse, revision prefix | `src/modules/media/server/media-key.ts` |
| Key -> owning Media (originals and renditions) | `src/modules/media/server/media-delivery.ts` |
| Driver interface and factory | `src/modules/media/server/storage/driver.ts` |
| Local and UploadThing drivers | `src/modules/media/server/storage/local.ts`, `src/modules/media/server/storage/uploadthing.ts` |
| Active driver: setting -> env -> default | `src/modules/media/server/storage/active.ts` |
| Driver names the admin and the API share | `src/modules/media/lib/storage-driver.ts` |
| MIME type -> Media type (image, video, audio, document) | `src/modules/media/lib/media-type.ts` |
| Rendition manifest and the `?mt=` token | `src/modules/media/lib/manifest.ts` |
| Read-only library audit | `src/modules/media/server/media-audit.ts`, `scripts/audit-media.ts` |
| Parsing and composing addresses | `src/modules/media/lib/url.ts` |
| Absolute form and own-host check | `src/modules/media/server/media-url.ts` |
| Quota arithmetic (pure vs database) | `src/modules/media/lib/quota.ts`, `src/modules/media/server/media-quota.ts` |
| Admin reads and row operations (tRPC) | `src/modules/media/server/procedures.ts` |
| Upload endpoint | `src/app/api/media/route.ts` |
| Replace endpoint | `src/app/api/media/[mediaId]/replace/route.ts` |
| Public delivery route | `src/app/media/[...path]/route.ts` |

## Key grammar

New keys are `<installationSlug>/<mediaId>/<revision>/<file>`, where `<file>` is `original` or
`<width>.<format>`. The whole revision shares the prefix, so deleting a Media is one
`deletePrefix`, and replacing a file bumps the revision so no cache can serve the old bytes.

`src/modules/media/server/media-key.ts` is the only composer and parser. Do not re-implement
segment counting in the route or the service; `parseMediaKey` returns `null` for a legacy flat
key, which is how the delivery route tells the two shapes apart.

Legacy keys are flat (`<provider-key>` or `<mediaId>/<revision>/<file>`) and are never renamed.
A Media with no recorded `storageDriver` is remote, because that is where its bytes are.

## A rendition has no row

An original is stored on `Media.key`. A rendition shares the revision prefix but has no Media
row of its own. The delivery route therefore:

1. looks up the exact `Media.key`;
2. if that misses, parses the key, finds the owner by `id + revision`, and requires the requested
   key to start with the owner's revision prefix.

That is what makes `/media/<slug>/<id>/<revision>/720.avif` work. A key that parses but does not
belong to the resolved row is a 404, not a stream. Do not "simplify" the route to an exact-key
lookup: local renditions stop resolving.

## Addresses

`Media.key` is the truth. `Media.url` is the relative delivery address
`/media/<key>`; when the Media has renditions, the URL also carries `?mt=` with the revision,
the archived flag and the rendition URLs. `stripMediaManifest` returns the plain path.

The local driver composes exactly this address through `mediaPath`; there is no environment
variable for a local public prefix, so a configuration mistake cannot produce addresses the
delivery route does not serve.

The path carries no domain. The `?mt=` token is the exception: for a remote row it can embed the
provider's rendition URLs, which is the debt recorded below. The absolute form is composed only
at a boundary that cannot use a relative URL: social metadata, JSON-LD, Stripe checkout images
and email HTML, through `absoluteMediaUrl` in `src/modules/media/server/media-url.ts`.

The route's `302` hop applies only to a row that stores a relative address and records a remote
driver. A pre-seam Media stores an absolute provider URL and the browser asks the provider
directly, so it never requests `/media/<key>` and never enters the route. That is why the hop is
not a path to own-domain addresses for legacy Media: making those traverse it would put a
provider lookup, or a rewrite, in front of every existing image.

The legacy `/assets/<key>` address is a build-time rewrite to the provider in
`next.config.mjs`. It stays for URLs stored before `/media/` existed; new Media never use it.

## Quota

`Settings.mediaQuotaMb` (default 5120) is the Installation's byte budget for media. Usage is
the original's `Media.size` plus the bytes in the rendition manifest, over every Media,
archived ones included. `src/modules/media/lib/quota.ts` is the pure arithmetic;
`src/modules/media/server/media-quota.ts` reads the database and holds the admission lock.

Permanent deletion is the only operation that frees quota. Archiving hides a Media from the
library but keeps counting it.

## Health check

`npm run media:audit` is a read-only check of the whole library after a storage change. It reads
every Media row, resolves the driver recorded on it and reports:

- how many Media each driver wrote (`local`, `uploadthing`, `unrecorded` for pre-seam rows and
  `unknown` for a name this build does not know);
- the recorded drivers this Installation has no credentials for;
- every Media that does not resolve, by id, with a reason (`unknown-driver`,
  `driver-unconfigured`, `no-storage-key`, `object-missing`);
- the bytes the database accounts for, the bytes local rows account for, and the bytes actually
  on the local volume;
- accounted, on-disk, missing and orphaned local objects.

Local objects are checked file by file against the volume. Remote rows are checked through their
driver's configuration and key grammar only; a read-only command must not fetch every provider
object. The command exits `1` when any Media is unresolved, so it can gate a deployment; orphaned
files are reported but do not fail it. The report carries Media ids and aggregates, never keys,
addresses or names, so it is safe to paste into a deployment log.

## Adding a driver

1. Implement `StorageDriver` in `src/modules/media/server/storage/<name>.ts`.
2. Add the name to `STORAGE_DRIVERS` in `src/modules/media/lib/storage-driver.ts`.
3. Wire it in `createStorageDriver` / `driverForStorageDriver`, and in the settings validation
   in `src/app/api/settings/route.ts`.
4. Add it to `isStorageDriverConfigured` (`src/modules/media/server/storage/driver.ts`): cleanup
   resolves a row's recorded driver and skips, rather than fails, when that driver is not
   configured on this instance.
5. Extend `storage-contract.test.ts`; the same suite must pass for every driver.
6. Keep keys driver-agnostic: a driver never appears in the image loader or in a stored absolute
   URL.

## Known debt (2026-11)

- `Media.url` carries the `?mt=` token, and for remote rows that token embeds provider URLs,
  while the spec says `Media.url` is `/media/<key>` and nothing else. Decide before the byte
  migration: derive the token at render time, or record the exception in ADR-0026.
- Updating `altText` changes published output but does not revalidate it
  (`revalidateContent` is not called).
- The picker copy still says "asset"; the glossary term is Media.
