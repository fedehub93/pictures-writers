# Local storage as a first-class driver

**Status:** ready-for-agent

## Problem Statement

The Installation's whole media library — 720 Media — lives on UploadThing with absolute provider URLs. The local storage driver exists and can be selected, but selecting it does not yet give the owner a library they can rely on:

- only images can be uploaded through the application transport; a document, audio or video file still enters only through UploadThing, and a non-image row never records the driver that wrote it;
- "Replace file" still uploads through UploadThing and writes through whatever the environment says, so it ignores the active driver and breaks once the provider is not configured;
- deleting a selection resolves one driver for the whole batch, so a mixed library leaves objects behind;
- the two backfills resolve one driver for the whole library, so they cannot run once the library is mixed;
- production has no persistent volume for the files, and the runbook says nothing about backing them up;
- nothing can prove that every Media still resolves through the driver that wrote it.

The owner wants to choose local storage and have the whole media library work — upload, replace, serve, delete — for every Media type, while the existing UploadThing Media keeps working unchanged and switching back is equally safe. Keeping the existing Media on UploadThing is the intended end state, not a temporary defect: no byte migration and no URL rewrite.

## Solution

Local storage becomes a first-class Storage driver for the whole media library, not just images, and every operation that touches bytes resolves the driver per Media row.

- One upload transport for every Media type, writing through the active driver; each Media records the driver that wrote it.
- Replace through the active driver and through the application's transport.
- Deletion and backfills resolve the driver per row.
- A persistent volume, its backup and its restore are documented and verified.
- A read-only audit proves that every Media resolves through its recorded driver and reports the mixed state.
- The active driver stays an Installation setting; switching it affects only new uploads. Existing Media keep their address and their driver, so the existing 720 Media keep their absolute UploadThing URLs and keep resolving directly.

## User Stories

1. As an owner, I want to select local disk and upload an image that is served from my own domain, so that new media no longer depends on a third party.
2. As an owner, I want to upload a document to the local driver and have it served with seeking support, so that documents are not second-class media.
3. As an owner, I want to upload an audio file to the local driver and have it served with seeking support, so that the library is not image-only.
4. As an owner, I want to upload a video file to the local driver and have it served with seeking support, so that the library is not image-only.
5. As an admin, I want to replace a file while local is active and have the new revision written to disk, so that the replace flow matches the storage I chose.
6. As an admin, I want to replace a file without the UploadThing dropzone, so that replace does not require a provider account.
7. As an admin, I want a replace that fails to leave the previous revision intact, so that a failed action never darkens an image.
8. As an owner, I want the previous object of a replaced legacy Media to be cleaned through the driver that owns it when that provider is configured, and to fail softly when it is not, so that replace neither breaks nor silently pretends to have cleaned up.
9. As an owner, I want to switch from local back to UploadThing without breaking the media already on disk, so that the choice stays reversible.
10. As an owner, I want to switch from UploadThing to local without breaking the media already on the provider, so that the choice is safe in both directions.
11. As a visitor, I want every existing media URL to keep working after any switch, so that the site never shows a broken image.
12. As a visitor, I want a missing local object to answer 404 instead of a stack trace, so that a broken reference never exposes the application.
13. As a visitor, I want Range requests to work for local documents, audio and video, so that downloading and seeking behave as they do today.
14. As a search engine, I want legacy image URLs to stay byte-for-byte identical, so that indexed images do not churn.
15. As a social crawler, I want og:image to keep answering for legacy Media and to answer on my own domain for local Media, so that previews never break.
16. As an admin, I want the quota to count documents, audio and video as well as images, so that the number reflects the disk.
17. As an admin, I want an upload refused by quota to leave nothing on disk, so that a failed attempt does not consume space.
18. As an admin, I want archived Media to keep being served and counted after the switch, so that "hidden from the library" never means "stops being served".
19. As an admin, I want to delete a selection that mixes legacy and local Media and have each object removed by the driver that owns it, so that no bytes are orphaned.
20. As an operator, I want to run the metadata and rendition backfills on a mixed library, so that old and new rows are both processed.
21. As an operator, I want a read-only audit that lists Media whose key cannot be resolved and counts rows per driver, so that I can prove the library is healthy after a change.
22. As an operator, I want the audit to compare the bytes on local disk with the bytes the database accounts for, so that I can detect orphaned or missing objects.
23. As an operator, I want the audit to exit non-zero when something is unresolved, so that it can gate a deployment.
24. As an operator, I want the media root on a persistent volume, so that a redeploy never loses uploaded files.
25. As an operator, I want the media volume in the backup and a restore procedure I have tested, so that media recovery is not improvised.
26. As an operator, I want the deployment order documented — code and migrations first, volume and backup next, the local choice last — so that the switch is deliberate.
27. As an operator, I want no environment variable that can set a public prefix the delivery route cannot serve, so that a configuration mistake cannot produce 404 renditions.
28. As an owner of a fresh Installation, I want the media library to work end to end with local disk and no provider account, so that installing the product needs no third-party signup.
29. As an owner of an existing Installation, I want the deploy of this change to alter nothing until I choose a driver, so that the change is opt-in.
30. As an owner of an existing Installation, I want to keep UploadThing for the media already there, so that the change is not a forced migration.
31. As a developer, I want one upload transport for every Media type, so that adding a driver never adds a transport.
32. As a developer, I want no operation to resolve one driver for a batch, so that a mixed library is a normal case rather than an edge case.
33. As a developer, I want the driver contract suite to keep proving both drivers, so that the seam stays real.
34. As a maintainer, I want the mixed-state rule and the 302 semantics recorded, so that nobody "simplifies" delivery back into a single-provider assumption.
35. As a maintainer, I want the docs to stop saying UploadThing is unchanged, so that an operator reading them is not misled.
36. As a maintainer, I want the previous media spec closed on paper, so that the tracker matches reality.

## Implementation Decisions

- The modules affected are the media service, the storage driver configuration, the upload endpoint, the replace endpoint, the delivery route (semantics unchanged), permanent deletion, the backfill commands, the settings validation, the admin replace UI and the self-hosting documentation.
- Every new Media records the Storage driver that wrote it, images and non-images alike. A non-image is stored as one original object and has no renditions.
- The upload transport accepts the Media types the library already classifies — image, video, audio and document. Images keep the 4 MB limit; non-images get 16 MB, matching the limits the library enforced while UploadThing owned the transport. A type the library cannot classify is refused with a machine-readable code. The endpoint's admin authentication is unchanged.
- Quota counts the original's bytes plus the rendition manifest's bytes for every Media, archived included. A refusal happens before any write, and a write that fails afterwards is rolled back.
- Replace resolves the active driver from the Installation setting, not the environment. It takes its bytes through the application transport instead of the UploadThing dropzone. It bumps the Media revision. Cleanup of the previous revision resolves the driver recorded on the existing row and never fails the replace.
- Permanent deletion resolves the driver per Media, for both the revision prefix and the legacy key.
- Both backfills resolve the driver per row, for reads and for writes.
- The audit is read-only. It reports rows per driver, unresolvable keys, local disk bytes against the bytes the database accounts for, and rows whose recorded driver is not configured on this instance. It reports Media ids rather than keys or URLs, and exits non-zero when any row is unresolved.
- The local driver always composes the canonical relative `/media/<key>` address. The configurable public-prefix environment variable is removed rather than validated, because the stored address and the delivery route are canonical and any other value produces addresses the route cannot serve.
- No schema change. `Media.storageDriver` already exists. Legacy rows keep no recorded driver and resolve as remote.
- No byte copy, no URL rewrite, no content sweep.
- The 302 delivery hop stays exactly as it is. It applies to a row with a relative address and a remote driver. Legacy rows have absolute addresses and never traverse the route; that is why they keep working.
- Production state: a persistent volume mounted at the local root, the root set through the existing environment variable, the volume included in the backup, and a restore drill performed. The development default stays inside the project directory and is ignored by git.
- Documentation changes: the media map, the environment appendix, the operations runbook and the ADR gain the mixed-state rule, the volume, backup and restore procedure, the audit and the non-image decision. The previous media spec is marked done.

## Testing Decisions

A good test exercises external behaviour at the highest seam that can express it: a request and its response, a file and the Media it becomes, a row and the bytes it resolves to. No test asserts which helper was called, and no test mocks a driver when a real one can run against a temporary directory.

Seams, in order of preference:

1. **HTTP upload to delivery** — the existing end-to-end seam. Post a file to the upload endpoint, receive a Media, fetch its address, compare bytes, content type and cache headers. Run it for an image and for a document, audio and video. Run it with the setting on local while the environment still says UploadThing, and the reverse.
2. **The delivery route** — the existing seam. Local object, remote object, legacy row with no recorded driver, Range, HEAD, missing key, traversal.
3. **The driver contract suite** — the existing seam. The same assertions against local and remote, including prefix deletion and the address shape.
4. **The media service** — revision bump and prefix removal on replace, quota refusal with no leftover bytes, a non-image row recording its driver, mixed-driver permanent deletion.
5. **The audit command** — a temporary root and a database fixture with one healthy local row, one healthy legacy row and one missing object; assert the counts, the unresolved ids and the exit code.

Prior art: the storage-setting end-to-end test, the delivery route test, the storage contract suite and the media service tests. The new cases extend those files rather than introducing a new harness.

Do not add a seam that mocks storage at the service boundary: the temporary-directory local driver is the second implementation the seam exists for.

## Out of Scope

- Copying the existing bytes to local disk and rewriting `Media.url` or the addresses embedded in content, Puck data, rich-text bodies, the logo setting, ad images or email HTML.
- Making the existing Media resolve on the site's own domain, whether by copying bytes or by rewriting addresses only.
- UploadThing as an Integration: token in the database, encrypted, a provider descriptor and form, and a runtime legacy-asset route.
- The five other upload purposes: avatars, submission attachments, impression files and email attachments. They keep the UploadThing transport and the token.
- An S3/R2 driver, shared buckets, billing or automated suspension.
- A per-Media action that moves a Media to the active driver.
- A storage column or filter in the media library.
- Disk-free preflight or alerting beyond the database quota.
- Video posters and duration extraction.
- Garbage collection of archived Media and quota grandfathering.

## Further Notes

- **Measured state of the existing Installation**, from aggregate reads only: 720 Media, all with no recorded driver; 701 on the current provider host and 19 on the older one; 701 with a rendition manifest and 19 without; about 84 MB of originals against a 5 GB quota; two legacy key shapes, 701 with three segments and 19 flat. The audit and the per-row backfills must handle both shapes.
- **The production database does not yet have the media migrations.** Shipping them is a prerequisite of this spec. After that deploy the setting is empty, resolution falls to the environment, and the historical default keeps UploadThing, so nothing changes until someone chooses local.
- **ADR-0026** already records the per-row driver and the delivery hop. This spec adds the operational completeness and the mixed-state acceptance; the revision should say so.
- **The 302 is not a path to own-domain addresses for legacy Media.** The browser never requests `/media/<key>` for a row whose stored address is absolute. Record that, so the route is not "fixed" into a rewrite that would put a provider API call in front of every image.
- **Done when**: the 720 existing Media answer 200 on unchanged addresses; a local image and a local document are served from the site's own domain with correct headers and Range; replace works with local active and no UploadThing dropzone; switching back to UploadThing leaves local Media serving; a mixed deletion leaves no bytes on either driver; the audit reports zero unresolved rows; a restore of the media volume brings the files back; the docs no longer describe UploadThing as unchanged.
