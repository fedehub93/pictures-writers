# Media: how a file is stored, addressed and served

This is the map of the media module, not a spec. The decisions are in
`docs/adr/0026-media-storage-seam-and-pregenerated-renditions.md`; the requirements and the
ticket history are in `.scratch/media-urls-and-uploads/spec.md`,
`.scratch/local-storage-completion/spec.md` and `.scratch/storage-location/spec.md`.

Read this before changing anything under `src/modules/media/`, `src/app/media/`,
`src/app/api/media/`, `src/app/files/` or `src/app/api/files/`.

## The two paths

```
upload    browser -> POST /api/media (multipart)
          -> createMediaFromUpload
          -> active storage driver
          -> Media row: key, url, storageDriver
          -> StoredFile row: key, driver, remoteUrl, content type, size, checksum

deliver   GET /media/<key>
          -> findDeliveryFile
          -> stored-file record: driver, remote address, content type
          -> local: stream from disk | remote: 302 to the recorded address
```

Attachments and avatars are other roles on the same record. The email composer
and the admin user editor use the application transports
(`POST /api/files/attachments` and `POST /api/files/avatars`), which write
through the active driver and answer under `/files/<key>`. The composer hands
the send use-case a stored-file id; the user update claims an avatar by its
canonical address and releases the previous one. Neither role has renditions and neither appears in the Media library. Their
objects are removed through the driver recorded on each file when the owning
message or user goes; a driver that is not configured here is reported by the
audit and its record is kept rather than lost.

An inbound email follows the same path. The webhook handler downloads each
attachment from the provider's expiring URL and writes it through the active
driver before it records the message, so the copy that survives is the one the
Installation owns. A storage failure is logged and only that attachment is
skipped: the message still arrives, and a failed write does not undo a copy
already stored.

A public form submission uses its own anonymous transport
(`POST /api/forms/<formId>/attachments`). It is rate-limited per client and per
form, capped at 4 MB and writes the record with `origin = public`, so the
budget can protect the owner from a stranger. The upload answers with a
`storedFileId` and the canonical `/files/<key>` address; the submission claims
it in the same transaction that saves the answer, so the stored data points at
the attachment and never at a provider address. A refused upload writes neither
bytes nor a record.

Every Media with a readable storage key has exactly one `StoredFile`, the
record that answers "where are the bytes": its key, the driver that owns it,
the provider address when the driver is remote, content type, size, checksum
and kind. New uploads and replacements write it in the same transaction as the
Media, so a failed write leaves neither; the one-time
`npm run media:backfill-files` creates it for Media that predate it, from what
the library already knows, and reports any Media whose key it cannot read. The
command never rewrites a Media row.

Delivery reads that record. A local file streams from disk with its recorded
content type; a remote file redirects to the address the record carries and
performs no provider API call. A rendition has no record of its own: delivery
proves it belongs to its Media's revision prefix and, when the Media is remote,
reads the provider address from the rendition manifest. A Media whose record
has not been created yet still resolves from its own columns, so deploying this
code before the one-time backfill cannot darken an existing picture.

The active driver decides where **new** uploads go. Resolution is the saved setting, then
`MEDIA_STORAGE_DRIVER`, then local disk, which is what lets a fresh Installation upload with no
provider account. Delivery never asks the active driver: it
asks the row, so switching storage affects only new files. Replace and permanent deletion read
the stored-file record too: the revision a replace supersedes is cleaned through the driver
recorded on the file, and the key's shape decides whether the unit is a prefix or the provider's
exact file key, so a backfilled pre-seam row is still removed by the key it has. The admin
library reads the record's key, size, content type, checksum and driver; `Media.url` stays the
canonical address the record's key composes. The Media's own storage columns are kept in step on
every write and are read only for a row whose record the one-time backfill has not created yet.
The metadata and rendition backfills read the stored-file record — its key, its driver, its
size, content type and checksum — and fall back to the Media's storage columns only for a row
whose record does not exist yet. They resolve the recorded driver per row for reads and writes,
so a library that mixes legacy provider Media and local Media is processed in one run; a row
whose driver is not configured here is reported and the run continues. Both backfills keep the
record true: the metadata run writes back the size, content type and checksum it discovers, and
the rendition run moves the record's key and provider address when a legacy flat key becomes a
namespaced one.

A mixed library is a transition, not a target: the Media that predate the seam stay on
UploadThing until the owner chooses to move them, and a Media uploaded with the local driver
active goes to disk. The library shows how many stored files remain on another driver and offers
the move; nothing moves automatically. Deletion, replacement, both backfills, the re-home and
the audit resolve the driver recorded on each file; no batch operation may resolve one driver
for a whole selection.

Every Media type enters through the same multipart transport. An image is normalised and cut
into the rendition ladder; a document, audio file or video is copied untouched to
`<revision>/original` and has no renditions. `classifyMediaType` decides the kind from the MIME
type: images keep the 4 MB transport limit, every other type gets 16 MB, and a type it cannot
classify is refused before any byte is written. The browser ships no storage provider client:
the library, attachments and avatars, public forms and inbound email all reach storage through
an application transport, and the provider survives only as a server-side driver while its
token is configured. `POST /api/media` accepts only multipart: any other body answers
`UNSUPPORTED_CONTENT_TYPE`, because the JSON branch that recorded a provider object as it
arrived is gone.

## Where things live

| Concern | File |
| --- | --- |
| Upload, replace, archive, delete, revisions | `src/modules/media/server/media-service.ts` |
| Attachment and avatar writes, cleanup, user avatars | `src/modules/media/server/owned-file.ts` |
| Canonical `/media` and `/files` addresses, one composer | `src/modules/media/lib/file-path.ts` |
| Stored-file location of one upload | `src/modules/media/server/stored-file.ts` |
| Stored-file location columns shared by server and library | `src/modules/media/lib/stored-file-location.ts` |
| One-time location backfill for existing Media | `src/modules/media/server/backfill-stored-files.ts`, `scripts/backfill-stored-files.ts` |
| Metadata and rendition backfills | `src/modules/media/server/backfill-media-metadata.ts`, `src/modules/media/server/backfill-media-renditions.ts` |
| Key grammar: compose, parse, revision prefix | `src/modules/media/server/media-key.ts` |
| Stored file -> owning Media (originals and renditions) | `src/modules/media/server/media-delivery.ts` |
| Driver interface and factory | `src/modules/media/server/storage/driver.ts` |
| Local and UploadThing drivers | `src/modules/media/server/storage/local.ts`, `src/modules/media/server/storage/uploadthing.ts` |
| Active driver: setting -> env -> default | `src/modules/media/server/storage/active.ts` |
| Driver names the admin and the API share | `src/modules/media/lib/storage-driver.ts` |
| MIME type -> Media type (image, video, audio, document) | `src/modules/media/lib/media-type.ts` |
| Rendition manifest and the `?mt=` token | `src/modules/media/lib/manifest.ts` |
| Read-only library audit | `src/modules/media/server/media-audit.ts`, `scripts/audit-media.ts` |
| Address sweep for legacy provider URLs | `src/modules/media/server/address-sweep.ts`, `scripts/sweep-media-addresses.ts` |
| Re-home preflight arithmetic | `src/modules/media/lib/rehome.ts` |
| Re-home job, preflight and journal | `src/modules/media/server/rehome.ts`, `scripts/rehome-media.ts` |
| Move progress, stop and supersede state | `src/modules/media/server/rehome-runner.ts` |
| Library move panel | `src/modules/media/ui/components/media-rehome-panel.tsx` |
| Purge journal | `StoragePurgeEntry` in `prisma/schema.prisma` |
| Parsing and composing addresses | `src/modules/media/lib/url.ts` |
| Absolute form and own-host check | `src/modules/media/server/media-url.ts` |
| Quota arithmetic (pure vs database) | `src/modules/media/lib/quota.ts`, `src/modules/media/server/media-quota.ts` |
| Quota refusal response | `src/modules/media/server/quota-error-response.ts` |
| Admin reads and row operations (tRPC) | `src/modules/media/server/procedures.ts` |
| Upload endpoint | `src/app/api/media/route.ts` |
| Replace endpoint | `src/app/api/media/[mediaId]/replace/route.ts` |
| Public Media delivery route | `src/app/media/[...path]/route.ts` |
| Public attachment and avatar delivery route | `src/app/files/[...path]/route.ts` |
| Admin attachment and avatar transports | `src/app/api/files/_lib/upload-owned-route.ts`, `src/app/api/files/attachments/route.ts`, `src/app/api/files/avatars/route.ts` |
| Public form attachment transport and limits | `src/app/api/forms/[formId]/attachments/route.ts`, `src/modules/forms/server/public-attachments.ts` |
| Form answer claims its attachments | `src/modules/forms/submissions/server/create-submission.ts` |
| Shared local streaming, Range and redirect headers | `src/modules/media/server/file-response.ts` |
| Avatar ownership and release | `src/modules/users/server/avatar.ts` |
| Inbound email attachment copy | `src/modules/mails/conversations/lib/handle-inbound-email.ts`, `src/modules/mails/conversations/lib/attachment-storage.ts` |

## Key grammar

New keys are `<installationSlug>/<mediaId>/<revision>/<file>`, where `<file>` is `original` or
`<width>.<format>`. The whole revision shares the prefix, so deleting a Media is one
`deletePrefix`, and replacing a file bumps the revision so no cache can serve the old bytes.

`src/modules/media/server/media-key.ts` is the only composer and parser of the key's path
segments. Do not re-implement segment counting in the route or the service; `parseMediaKey`
returns `null` for a legacy flat key, which is how the delivery route tells the two shapes apart.
The delivery token in `src/modules/media/lib/manifest.ts` parses only a rendition filename
(`<width>.<format>`) to find the address it already carries; it never parses a storage key.

Legacy keys are flat (`<provider-key>` or `<mediaId>/<revision>/<file>`) and are never renamed.
Before a stored-file record exists, a Media with no recorded `storageDriver` is remote, because
that is where its bytes are.

## A rendition has no row

An original is recorded on the StoredFile's key. A rendition shares the revision prefix but has
no record of its own. The delivery route therefore:

1. looks up the StoredFile by key;
2. if that misses, looks up the Media by key, for a row whose record was not created before the
   one-time backfill;
3. if that misses, parses the key, finds the owner by `id + revision`, and requires the requested
   key to start with the owner's stored-file revision prefix.

That is what makes `/media/<slug>/<id>/<revision>/720.avif` work. A key that parses but does not
belong to the resolved row is a 404, not a stream. Do not "simplify" the route to an exact-key
lookup: local renditions stop resolving.

For a remote Media, the rendition's provider address is read from the `?mt=` manifest its Media's
address already carries, so the redirect never asks the provider. A manifest with no address for
the requested rendition answers 404 rather than falling back to a provider read; so does an address
that points back at `/media/`, which a manifest written while the file was local still carries.

## Addresses

The stored-file record's key is the truth. `Media.key` mirrors it until the column is dropped:
`Media.url` is the relative delivery address `/media/<key>`; when the Media has renditions, the URL
also carries `?mt=` with the revision, the archived flag and the rendition URLs.
`stripMediaManifest` returns the plain path.

The local driver composes exactly this address through `mediaPath`; there is no environment
variable for a local public prefix, so a configuration mistake cannot produce addresses the
delivery route does not serve.

The path carries no domain. The `?mt=` token is the exception: for a remote row it can embed the
provider's rendition URLs, which is the debt recorded below. The absolute form is composed only
at a boundary that cannot use a relative URL: social metadata, JSON-LD, Stripe checkout images
and email HTML, through `absoluteMediaUrl` in `src/modules/media/server/media-url.ts`.

The route's `302` hop serves any file whose recorded driver is not local, including a pre-seam row
with no record (it resolves as UploadThing). That row's stored address is absolute, so the browser
asks the provider directly and does not request `/media/<key>` for it. That is why the hop is not a
path to own-domain addresses for legacy Media: their stored addresses are absolute, so serving
them on this Installation's domain requires the address sweep
(`npm run media:sweep-addresses`), not the hop.

The hop carries `Cache-Control: public, max-age=300`, never `immutable`: the redirect points at
bytes a later move can take away, so caching it as if it were the file would leave a visitor
requesting a deleted object. `immutable` remains on the `200` response, whose bytes never change
under a key because a replace bumps the revision.

The legacy `/assets/<key>` address is a build-time rewrite to the provider in
`next.config.mjs`. It stays for URLs stored before `/media/` existed; new Media never use it.

## Address sweep

A library that predates the seam stores the provider's absolute URL in `Media.url` and in the
content that copied it: Puck documents, TipTap bodies, product descriptions, ad images, the logo
setting, form submission data, user images and the legacy attachment rows. Those strings are the
only thing tying the Installation to the provider's host. `npm run media:sweep-addresses` rewrites
each one into the canonical address of the Stored file it names. The one-time location backfill
(`npm run media:backfill-files`) comes first: a Media with no Stored file has no canonical address
to write, so the sweep reports its address and leaves it.

The canonical address comes from one index built from every Stored file: a Media answers with
`/media/<key>`, an attachment or avatar with `/files/<key>`. A content reference gets a rendition
token whose rendition URLs are themselves `/media/<key>` paths, so a later move cannot leave a
provider URL inside a page; `Media.url` keeps the rendition token it already carries, because that
token is what lets the delivery route redirect a remote rendition before the bytes move. A provider
URL, the legacy `/assets/` shape and an absolute address the library already recorded all resolve
through the index. An ordinary external link is left alone. Running the command again reports zero
changes, because an address already in canonical form is never touched.

The sweep moves no byte and writes no Stored file: keys, revisions, drivers and remote locations
are read, never changed. It only rewrites addresses, so it can run while the site serves: the
provider addresses it replaces still answer until the purge, and a cached page keeps them until its
normal revalidation (the 24h ISR backstop or the next deploy), so no visitor sees a broken picture.
It must run first: a Media still addressed by a provider URL is refused by the move
(`address-not-canonical`), because journaling that provider object would let the purge delete bytes
published content still links to.

`npm run media:sweep-addresses:dry-run` (or `--dry-run`) reports the same work without writing.
The report names each field with the rows, addresses and unresolved counts; it never prints a key,
an address or a provider host. An address no Stored file owns is left exactly as it was, and the
command exits `1` so the next storage step can be gated on it.

## Re-home

Switching the active driver changes where the next upload is written. **Re-home** moves the
bytes of every stored file that is not on the active driver there, so the library becomes one
driver's again. It is an explicit, resumable job; it never runs on its own.

The goal is recomputed from the database at every start: every stored file sits on the active
driver. The job copies one file at a time — a Media's original and every rendition in its
manifest, an attachment or avatar its one object — verifies the source against the checksum the
record carries (a rendition against its recorded size), reads the copy back from the target to
prove it is those bytes, then flips the record's `driver` and `remoteUrl` in one transaction. The
key, the revision and the original's canonical address never change; only a Media's `?mt=` token
learns the new rendition addresses. A failure before the flip removes the target copy and leaves
the source serving, so no failure path can break an address. A local source is removed after the
flip; a provider object is not deleted, because the redirect hop may still be cached.

A Media whose stored address is still a provider URL is refused by id (`address-not-canonical`)
and left serving: moving it would journal the provider object for removal while published pages
still link to it, so the address sweep (`npm run media:sweep-addresses`) has to run first.
Attachments and avatars carry no address on their role; the strings their owners hold are what
the sweep rewrites before they move.

An interrupted run resumes where it stopped: a file already flipped is no longer pending, so it
is never copied again. A file whose source cannot be read is reported by stored-file id, stays on
its current driver and keeps serving. A newer driver choice supersedes the run at the next file,
and the next run converges on the new target. The library polls the run's progress and can stop
it at a file boundary; the file being copied finishes first, so a stop is always safe.

Before starting, the preflight estimates the bytes the move copies (originals plus rendition
manifests) and reserves `10%` headroom. When the volume can hold the copies but not the headroom,
the owner must confirm; when it cannot hold even the copies, the run is refused. A file whose
recorded size is unknown makes the estimate incomplete, so that too needs a confirmation. A
provider target has no volume here and never warns.

Every provider object the move abandons is written to the **purge journal**
(`StoragePurgeEntry`): the driver, the exact key and its size, stamped with the flip's time.
Pre-seam keys are not namespaced, so the journal, not a prefix scan, is what lets a later purge
remove exactly what a move left. A key that becomes live again on a driver has its journal entry
removed in the same flip, so the purge is never pointed at bytes the library serves. The journal
is consumed by the separate purge command, after a grace window; the move never deletes a
provider object.

`npm run media:rehome` runs the same job from the command line. It prints the plan, needs `--yes`
for a warning-level plan, refuses an impossible one, and exits non-zero when a file could not be
moved. The media library offers the same move, shows the identical preflight, and reports the
failures by id. The run's progress and stop live in memory
(`src/modules/media/server/rehome-runner.ts`): the deployment is single-instance by design, and
a restart loses only the progress display, never the files already flipped.

## Quota


`Settings.mediaQuotaMb` (default 5120) is the Installation's byte budget for the disk. One number
covers every `StoredFile`, whatever its role: a Media contributes its original's stored-file size
plus the bytes in its rendition manifest, an attachment or avatar its own size, and archived
Media keep counting. A Media whose location record does not exist yet (before the one-time
backfill) still counts from its own columns, so deploying this code early cannot under-count.
`src/modules/media/lib/quota.ts` is the pure arithmetic; `src/modules/media/server/media-quota.ts`
reads the database and holds the admission lock.

Inside that budget, `Settings.publicOriginReserveMb` (default 512, a tenth of the default quota)
is the share public-origin files may occupy. A public upload is admitted only when it fits both
the total quota and the reserve, so visitors can never block the owner's uploads; an internal
upload is bounded by the total quota only. Every transport takes the same advisory lock, so an
admin upload started at the same moment as a refused public one still succeeds. Zero refuses
every public upload, and an Installation with no public forms never reaches the reserve. The
setting is validated against the quota: a reserve above it is refused, because the reserve is a
share held inside the quota. A refusal answers a machine-readable code — `MEDIA_QUOTA_EXCEEDED`
for the total, `PUBLIC_ORIGIN_RESERVE_EXCEEDED` for the reserve — and writes neither bytes nor a
record.

Permanent deletion is the only operation that frees quota. Archiving hides a Media from the
library but keeps counting it. Deleting the owner of an attachment or avatar removes its record
and its bytes, so the bytes stop counting with them. Nothing is ever deleted automatically for
budget reasons.

## Health check

`npm run media:audit` is a read-only check of the whole library after a storage change. It reads
every Stored file, resolves the driver recorded on it and reports:

- how many files each driver wrote (`local`, `uploadthing`, and `unknown` for a name this build
  does not know);
- the drivers this Installation can reach, and the recorded drivers it has no credentials for;
- every file that does not resolve, by id, with a reason (`unknown-driver`,
  `driver-unconfigured`, `no-storage-key`, `no-stored-file`, `object-missing`);
- the bytes the database accounts for, the bytes local files account for, and the bytes actually
  on the local volume;
- accounted, on-disk, missing and orphaned local objects.

A Media with no stored-file record is reported as `no-stored-file`, so the audit fails until the
one-time location backfill has run. Local objects are checked file by file against the volume,
using the key the record carries; remote files are checked through their driver's configuration
and the presence of a readable key only, because a read-only command must not fetch every
provider object. The command exits `1` when any file is unresolved, so it can gate a deployment;
orphaned files are reported but do not fail it. After a re-home every file records the target
driver, so the report names one driver and no unresolved file; a file the move could not read is
exactly what its unresolved list names. The report carries file ids and aggregates, never keys,
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
  while the spec says `Media.url` is `/media/<key>` and nothing else. Re-home rewrites the token
  in the same transaction as the flip, so a move keeps delivery working; deriving the token at
  render time remains the cleaner shape and is not done.
- Updating `altText` changes published output but does not revalidate it
  (`revalidateContent` is not called).
- The picker copy still says "asset"; the glossary term is Media.
