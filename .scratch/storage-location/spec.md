# One storage location for every file

**Status:** ready-for-agent

## Problem Statement

Storage already sits behind a seam, but the **address** of a file is still decided by the
driver. Media uploaded before the seam keep the provider's absolute URL; Media written by the
local driver keep the canonical path. Switching the active driver therefore does not switch the
library: it leaves every existing file where it is and puts the new ones somewhere else, and the
two populations are addressed differently — one from the provider's domain, one from the site's.
There is no way to move a library to another driver without rewriting the addresses embedded in
content, and no way to leave a provider without either breaking published pages or keeping the
provider forever.

The same defect exists for every other file the product stores. Attachments of form
submissions, attachments of email messages and user avatars are plain URLs written straight from
the provider: they record nothing about where their bytes are, cannot be deleted after a switch,
are counted by no budget, and cannot be listed.

One Installation is living this today: 720 Media, all on UploadThing, all addressed by absolute
provider URLs, spanning two provider hosts. Its owner wants to finish the move to local disk
without a rewrite of published content, without a window where pictures break, and without
keeping the provider alive. A different owner wants the opposite: start on local disk and add a
provider later. Both are the same problem, and the current design solves neither.

## Solution

A single record of **where the bytes of a file are**, and a single canonical address per file
that never depends on the driver.

Every stored file gets one `StoredFile` record: storage key, driver, the remote address when the
driver is remote, content type, size, checksum, kind and origin. The library's `Media` becomes a
**role** on top of that record — alt text, revision, rendition manifest, archive state and the
relations content follows. Attachments and avatars are other roles on the same parent, so one
file has one location and one address no matter what it is used for.

The public address of a file is always the Installation's own domain: library Media under
`/media/<key>`, every other file under `/files/<key>`. No stored address ever contains the
driver.

Because the address is independent of the driver:

- **choosing a driver is instant and reversible.** It changes where the next upload is written
  and nothing else. No byte moves, no address changes, no visitor sees a difference;
- **moving the bytes is a separate job.** It rewrites `driver` and `remoteUrl` on each file and
  leaves its address untouched, so it can run for hours, be interrupted and resumed, and no
  published page changes while it does;
- **removing a provider is a final, explicit act** gated by an audit and a grace window;
- **a fresh Installation needs no provider account at all**, and the browser never contacts a
  storage provider again — the provider survives only as a server-side driver reachable while
  its token is configured.

## User Stories

1. As the owner of a fresh Installation, I want to upload an image with no provider account, so
   that installing the product needs no third-party signup.
2. As the owner of a fresh Installation, I want that image served from my own domain, so that no
   third party appears in the address of my content.
3. As the owner of a fresh Installation, I want a provider I cannot configure to be shown
   unavailable with the reason, so that I do not discover the problem through a failed upload.
4. As the owner of an Installation already on a provider, I want the first deploy to change
   nothing until I choose a driver, so that the change is opt-in.
5. As the owner of an Installation already on a provider, I want my existing images to answer on
   my own domain without moving a byte, so that my indexing does not churn and my visitors see
   no interruption.
6. As the owner of an Installation already on a provider, I want to move the bytes to local disk
   later, so that I stop depending on the provider without changing any published address.
7. As the owner of an Installation already on a provider, I want to remove the provider's copies
   only after everything is verified, so that the last step is deliberate and reversible until I
   take it.
8. As the owner of an Installation on local disk, I want to select a provider again and have its
   new uploads go there, so that the choice is not one-way.
9. As the owner of an Installation on local disk, I want a provider-backed file to keep serving
   when I switch to local, so that a switch never darkens a picture.
10. As the owner, I want to switch the driver without a restart or a redeploy, so that the change
    takes effect on the next upload.
11. As the owner, I want to see that a switch left files on the old driver and be offered the
    move, so that I understand the state of my library without reading a log.
12. As the owner, I want to see progress while the files move and be able to stop, so that I can
    let it run off-peak and finish it later.
13. As the owner, I want an interrupted move to resume where it stopped, so that a redeploy
    never costs me the work already done.
14. As the owner, I want a file that could not be moved to keep serving from where it is, so that
    a failure never becomes a broken image.
15. As the owner, I want to be warned before a move that needs more disk than I have, so that I
    do not fill the volume mid-way.
16. As the owner, I want to change driver again while a move is running without corrupting
    anything, so that the selector stays trustworthy.
17. As the owner, I want a rollback to the previous driver to be equally safe, so that I can try
    a switch and change my mind.
18. As a visitor, I want every file to answer on the Installation's domain, whatever driver holds
    it, so that the address I bookmark never changes.
19. As a visitor, I want a missing file to answer 404 instead of a stack trace, so that a broken
    reference never exposes the application.
20. As a visitor, I want Range requests to work for documents, audio and video, so that
    downloading and seeking behave as they do today.
21. As a search engine, I want the canonical address of a Media to survive any driver change, so
    that my index does not churn.
22. As a social crawler, I want a preview image to answer on the site's own domain, so that
    previews keep working when a provider is removed.
23. As a visitor, I want a redirect to a provider not to be cached as if it were the file, so
    that a later move does not leave me requesting a deleted object.
24. As a form submitter, I want to attach a file and have it arrive, so that the form is usable
    on an Installation with no provider account.
25. As a form submitter, I want my attachment served from the site's own domain, so that the
    link I keep works.
26. As the owner, I want a public upload endpoint to be rate-limited and size-capped, so that a
    stranger cannot fill my disk through a form.
27. As the owner, I want a budget reserved for files that come from the public, so that strangers
    cannot block my library uploads.
28. As an admin, I want to attach a file to an email reply, so that the composer works without a
    provider account.
29. As an operator, I want inbound email attachments copied into my own storage, so that a
    provider's expiring URL is not the only copy.
30. As an admin, I want to set a user's avatar, so that avatars work without a provider account.
31. As an admin, I want an attachment to be deleted when the message or submission that owns it
    is deleted, so that storage does not leak.
32. As an admin, I want an avatar to disappear with its user rather than be deletable from the
    library, so that no library action can break an account.
33. As an admin, I want attachments never to appear in the media library, so that the library
    stays a content library.
34. As an admin, I want the quota to count every stored file and still show one number, so that
    what I see matches the disk.
35. As an admin, I want archived Media to keep being served and counted, so that "hidden from the
    library" never means "stops working".
36. As an admin, I want an upload refused by quota to leave nothing behind, so that a failed
    attempt costs no space.
37. As an operator, I want a read-only audit that reports files per driver, unreachable files and
    disk against accounting, so that I can prove the Installation is healthy after a change.
38. As an operator, I want the audit to fail the command when something does not resolve, so that
    it can gate a deployment.
39. As an operator, I want a command that rewrites legacy absolute addresses, idempotent and with
    a report of what it could not reach, so that the sweep is verifiable.
40. As an operator, I want to delete the provider's copies only after a grace window, so that a
    mistake has a recovery path.
41. As a maintainer, I want one record per stored file, so that a future file manager can list,
    filter and count everything with one query.
42. As a maintainer, I want the driver contract suite to keep proving every driver, so that the
    seam stays real.
43. As a maintainer, I want the mixed library to be described as a transition, so that nobody
    treats it as the target.
44. As a maintainer, I want the glossary to distinguish a File from a Media, so that the next
    feature does not invent a third table for bytes.
45. As a maintainer, I want the browser to stop shipping a provider client, so that no user path
    depends on a provider SDK.

## Implementation Decisions

### The storage location model

- One **`StoredFile`** record per file the Installation owns: storage key, driver, remote
  address (null for a local file), content type, size, checksum, kind (`media`, `attachment`,
  `avatar`), origin (`internal`, `public`), timestamps. The storage key is unique.
- **`Media` stays** and is the availability anchor for content: seven relations point at it. It
  keeps `id`, name, type, alt text, revision, dimensions metadata, rendition manifest and archive
  state, and gains a one-to-one reference to its `StoredFile`. It **loses** key, url, size,
  mime type, checksum and storage driver.
- **`Media.url` is removed.** The canonical address is composed from the file's kind and key by
  one composer, the same way the key itself is composed by one composer today. No second string
  to drift.
- **`Attachment`** replaces `EmailAttachment` as a role: owner (an email message or a form
  submission, exactly one of the two), original filename, external id, and a one-to-one
  reference to its `StoredFile`. `FormSubmission` data keeps the submitted values, pointing at
  the attachment; it never holds a provider address.
- **Avatars** are `StoredFile` rows of kind `avatar`; the user's image column keeps holding the
  canonical address, because the auth layer owns that column. It is resolved by the same
  composer and parser as every other address.
- **Renditions have no record of their own.** They live under the same revision prefix as their
  original. For a remote driver, the rendition manifest records each rendition's remote address
  at write time, so the redirect needs no provider API call.
- The storage key is `<installationSlug>/<fileId>/<revision>/<file>`. A **replace** bumps the
  revision and therefore changes the key and the address; a **move** changes neither.

### Addresses and delivery

- Two public prefixes, both on the Installation's own domain: `/media/<key>` for kind `media`,
  `/files/<key>` for every other kind. The prefix conveys the role, never the driver.
- One delivery route per prefix, sharing one implementation: resolve the `StoredFile` by key,
  then let the recorded driver answer. A local file is streamed with `Content-Type`, `ETag`,
  `Cache-Control`, `Accept-Ranges` and `Range` support; a remote file is a redirect to its
  recorded remote address.
- **A redirect is never `immutable`.** The hop is cached for minutes (`max-age=300`), while the
  bytes behind it carry the provider's own long cache. `immutable` remains only on 200
  responses. Today the hop carries a one-year immutable header, which is harmless only while no
  row uses it and becomes a broken image the moment a row moves after the hop has been cached.
- A key that parses but does not belong to the addressed file is a 404, not a stream.
- The canonical address is made absolute only at a boundary that cannot use a relative URL —
  social metadata, JSON-LD, checkout images and email HTML — and that absolute form is always
  the Installation's own domain.

### Driver choice and switching

- The active driver remains an Installation setting, falling back to configuration, falling back
  to **`local`**, which is what makes a fresh Installation work with no provider. The token for
  the provider stays in configuration.
- The provider is offered only while it is configured; otherwise it is shown disabled with the
  reason, in the library and in the setting's validation.
- **Switching is hot:** one setting row, effective on the next upload, no restart, no redeploy.
  It changes nothing about existing files.
- The product then shows that some files are still on another driver and **offers** the move. It
  never performs it automatically.
- The **move job** has one goal, recomputed from the database at every start: *every stored file
  sits on the active driver*. It copies one file at a time, verifies the checksum, then writes
  the new driver and clears the remote address. It is idempotent, resumable, and one at a time;
  a newer switch supersedes it and the next run recomputes. A file that cannot be read is
  reported and left where it is, still serving from there.
- The job **does not bump the revision**: the bytes are identical, so keys and addresses stay.
- A **disk preflight** estimates the space the move needs (accounted bytes with headroom) and
  warns with a confirmation; it refuses to start when the space is clearly insufficient.
- The move writes every abandoned remote object into a **purge journal**. The journal is what
  makes a later removal precise, because pre-seam keys are not namespaced and cannot be found by
  a prefix scan.
- **Removal is a separate command**: requires a green audit and zero files on that driver, runs
  only on journal entries older than a grace window (default seven days), and demands a typed
  confirmation. It is never automatic.

### Uploads

- One multipart transport for the library, unchanged in behaviour, writing through the active
  driver and creating the `StoredFile` plus its `Media` role.
- One transport for admin attachments (email replies and avatars), and one for public form
  submissions. The public one is rate-limited per client and per form, capped in size, and
  attributed `origin = public`.
- Inbound email attachments are copied through the same transport instead of the provider's SDK.
- Replace keeps its current semantics: the bytes go through the application transport, the
  revision bumps, the previous revision is cleaned through the driver recorded on the file, and
  a cleanup failure never fails the replace.
- The browser-side provider client and the provider's file router are **removed**, together with
  the three endpoints that no longer have a caller (the legacy media upload, the post image and
  the impression file), and with the JSON branch of the media upload endpoint.
- The profile-image, form and email endpoints move to the application transport with the driver
  recorded per file, so that no feature requires a provider account.

### Deletion, quota, audit

- Deleting a Media deletes its objects through the driver recorded on it and then its record.
  Deleting an attachment deletes its object with the message or submission that owns it; deleting
  an avatar deletes its object with the user.
- **One quota over every stored file**, counting an original's bytes plus its rendition manifest,
  archived files included, because the number describes the disk. A **reserve for public-origin
  files** sits inside that number so that public uploads can never block library uploads. Refusal
  happens before any write, and a write that fails afterwards is rolled back.
- The audit reads every stored file, resolves the recorded driver, and reports files per driver,
  unresolved files by id and reason, configured drivers, accounted bytes against local bytes, and
  orphaned local objects. It exits non-zero when anything is unresolved.

### The existing Installation

Three steps, each verifiable on its own, executed against production in this order:

1. **Addresses.** Create a `StoredFile` for each existing Media from its key, size, type and
   checksum; record the current absolute address as the remote address; rewrite `Media.url` out
   of existence and every embedded address (`puckData`, rich-text bodies, ad items, the logo
   setting, form submission data, email attachment urls, user images) to the canonical form. No
   byte moves. Verified by every existing Media answering on its canonical address and by a green
   audit.
2. **Bytes.** Run the move job to local disk, then purge after the grace window.
3. **The rest.** Create `StoredFile` rows for attachments and avatars from their current
   addresses, copy their bytes, rewrite their strings, purge.

The mixed library exists only between steps 1 and 2.

### Documentation

- The glossary gains **Stored file** as the parent term, with **Media**, **Attachment** and
  **Avatar** as roles, and **Storage location** and **Re-home** as the vocabulary for where bytes
  live and how they move.
- The media map, the ADR and the self-hosting pages describe the mixed library as a transition,
  the canonical address as driver-independent, the move and the purge, and the fact that a fresh
  Installation needs no provider.

## Testing Decisions

A good test exercises external behaviour at the highest seam that can express it: a request and
its response, a file and the bytes it becomes, a database fixture and the state a job leaves
behind. No test asserts that a helper was called, and no test fakes a driver when a real local
driver can run against a temporary directory.

Seams, in order of preference:

1. **HTTP upload to delivery.** The existing end-to-end seam. Post a file through the transport,
   receive the file's canonical address, fetch it, compare bytes, content type, cache headers and
   Range support. Run it for an image and for a document, audio and video; for a library upload,
   an attachment and an avatar; with the setting on local while configuration still names the
   provider, and the reverse. Extends the existing storage-setting end-to-end tests.
2. **The delivery routes.** Local 200/206/HEAD/404/traversal, remote redirect, a redirect that
   carries a short cache rather than an immutable one, and a remote redirect that performs no
   provider read — observable at the fake provider boundary, which is the seam the delivery suite
   already uses.
3. **The driver contract suite.** The same assertions against both drivers, as today.
4. **The move job.** A database fixture whose files sit on two drivers, a temporary local root
   and the fake provider client. Assert that every file ends on the target driver, that keys and
   canonical addresses are unchanged, that the revision did not move, that an interrupted run
   resumes, that a file the provider cannot read stays serving, and that the purge journal holds
   exactly the abandoned objects. Prior art: the rendition and metadata backfill suites.
5. **The sweep.** A fixture with absolute addresses in every listed field; assert the rewrite,
   idempotence on a second run, and the residual report.
6. **The audit.** The existing fixture extended to stored files, with the exit code and the
   journal.
7. **Quota.** One budget across kinds, the public reserve refusing only public uploads, and a
   refusal leaving no bytes and no row.

The fake provider client, the temporary local root and the real database are the established
seams; new tests extend those files rather than introducing a harness. Do not add a seam that
mocks storage at the service boundary.

## Out of Scope

- An S3/R2 driver. The contract must allow it; implementing it is a separate change.
- UploadThing as an Installation Integration: its token stored in the database, encrypted, with a
  provider form in the backoffice. This spec leaves the token in configuration.
- The file manager UI. This spec only makes it possible: one record per stored file, with kind,
  origin, owner and size.
- Serving bytes directly from the reverse proxy or a CDN, bypassing the application. The address
  is already canonical, so that is an optimisation behind the same contract.
- Content-addressed deduplication of identical files.
- Rewriting the HTML of email messages that were already sent; their provider addresses are
  outside the database.
- Video posters and duration, garbage collection of archived Media, per-file moves, and a
  storage filter in the media library.

## Further Notes

- **Measured state of the existing Installation:** 720 Media, none recording a driver; 701 on the
  current provider host and 19 on an older one; 701 with a rendition manifest and 19 without;
  about 84 MB of originals against a 5 GB quota; two legacy key shapes (three segments and flat).
  The audit, the sweep and the move must handle both shapes, and the flat keys are why the purge
  needs a journal rather than a prefix scan.
- **The current media branch is a prerequisite, not a detour.** It delivers the per-file driver
  record, the canonical delivery route, the quota, the audit, every media type through one
  transport, and replace through the active driver. It must reach production first: its audit and
  its route are the safety net that makes the move verifiable. This spec supersedes its
  "mixed library is the end state" revision.
- **Production has none of the media migrations yet.** The deploy order is: the current branch
  with its migrations and the volume; then this spec in its three steps. The setting is empty
  after the first deploy, resolution falls to configuration, and nothing changes until someone
  chooses.
- **Derived default.** The default driver becomes `local` rather than the provider, because a
  fresh Installation must work with no token. The existing Installation has an explicit setting
  by the time step 1 runs, so the change of default cannot move any of its files.
- **The redirect defect is worth fixing before anyone uses it.** The delivery route marks the
  provider hop with a one-year immutable cache. Any Installation that rewrites addresses before
  moving bytes would cache the redirect and see broken images after the purge.
- **Already-sent email HTML is the one accepted casualty of the purge.** The grace window is the
  whole mitigation. If it turns out to matter, the alternative is to keep the provider objects
  referenced only by those messages alive indefinitely — a decision for the owner of that
  Installation, not for this spec.
- **Done when:** a fresh Installation uploads an image, a document and an avatar with no provider
  token and serves all three from its own domain; the existing Installation's 720 Media answer on
  their canonical addresses before a byte moves; the move leaves every key, address and revision
  unchanged; an interrupted move resumes; switching back and forth breaks nothing; an attachment
  and an avatar follow the same rules as a Media; the audit is green and exits non-zero when
  something is unresolved; the purge removes exactly the journal's objects after the grace
  window.
