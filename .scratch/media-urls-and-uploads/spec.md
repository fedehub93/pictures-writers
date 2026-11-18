# Media addresses and driver-agnostic uploads

**Status:** ready-for-agent

## Problem Statement

Every media URL the CMS stores is an UploadThing URL. That is fine for the one Installation that already exists and has its files there, but it makes the product impossible to install anywhere else: a fresh Installation has no UploadThing account, and the local storage driver that already exists in the codebase cannot be selected or served.

The browser uploads straight to UploadThing's file router, the server receives only metadata, and the media processor then reads the bytes back through the storage driver — a local driver looks for a file on disk that UploadThing never wrote. The driver that is supposed to make an Installation self-contained is dead code in production.

Four consequences the owner feels:

- Media URLs are the provider's, so moving storage means rewriting posts, pages, products, Puck data, rich-text bodies and email HTML — the WordPress migration problem. The storage seam exists precisely so that this is a copy job, but nothing yet builds the address that would survive it.
- Nothing serves `/media/<key>`, the address the local driver already composes, so a Media row created on disk would resolve to a 404.
- An Installation has no notion of how much space it is using, so a single mis-upload can fill the disk that hosts PostgreSQL, and a sold plan has no unit to price.
- Switching storage driver would darken every existing file, because the system has no record of which driver wrote which Media.

## Solution

One canonical, provider-independent media address, `/media/<key>`, served by the application: streamed from disk when the storage driver that wrote the Media is local, a cacheable `302` to the provider's CDN when the driver is remote. `Media.key` is the truth and `Media.url` is a relative projection of it, so no stored URL carries a domain and changing domain or provider never touches content.

Each Media records the storage driver that wrote it. Delivery resolves the driver per row, so switching the active driver affects only new uploads: everything already stored keeps resolving through the driver that wrote it, and a later migration moves files row by row instead of flipping a switch that darkens half the site. Media created before this change carry no driver and are treated as remote, because that is where their bytes are.

One upload transport replaces the browser-to-provider path: the browser posts the file to the application, and the application writes it through the active storage driver. Which driver is active stops being a decision about transport and becomes only a decision about where bytes live. It is chosen in the media library and recorded on each Media it writes.

Storage keys for new files are namespaced per Installation, so two Installations can share a bucket or a disk and one can be deleted by prefix. Existing keys keep their flat legacy shape and keep resolving, untouched.

Each Installation has a media quota in its settings, counted over originals and generated renditions, visible in the library and enforced before an upload writes anything.

## User Stories

1. As a visitor, I want every media URL on the site to be on the site's own domain, so that the pages I read and bookmark do not depend on a third party's hostname.
2. As a visitor, I want images served from an address that is cached as immutable, so that repeat visits cost no extra request.
3. As a visitor, I want a PDF, audio file or video served by the same address scheme, so that downloading and seeking work as they do today.
4. As a visitor, I want a missing file to answer 404 rather than a stack trace, so that a broken reference never exposes the application.
5. As a search engine, I want image URLs that stay stable across storage changes, so that indexed images do not churn.
6. As a social crawler, I want `og:image` to be an absolute URL that answers directly, so that previews never break.
7. As an admin, I want to upload a file from the library exactly as I do today, so that nothing about my editing flow changes.
8. As an admin, I want an upload to keep working after the storage driver is switched, so that changing where bytes live is not my problem.
9. As an admin, I want to see how much space the library occupies, so that I am not surprised by a full disk.
10. As an admin, I want a warning at 80% and a refusal at 100% with the actual numbers, so that I know exactly what to delete or how much to raise.
11. As an admin, I want a refused upload to leave nothing behind, so that a failed attempt does not consume quota.
12. As an admin, I want archived Media to keep working on the site but still count against the quota, so that "hidden from the library" never means "stops being served".
13. As an owner of a new Installation, I want the media library to work with local disk and no provider account, so that installing the product needs no third-party signup.
14. As an owner of a new Installation, I want my media under a folder named after my Installation, so that my files cannot collide with another Installation's.
15. As an owner of an existing Installation, I want my existing files to keep working with no migration, so that this change is invisible to my readers.
16. As an owner of an existing Installation, I want to keep UploadThing until I decide otherwise, so that the change is not a forced migration.
17. As an owner of an existing Installation, I want to switch to local disk later without touching content, so that the cost decision can wait.
18. As an operator, I want a media quota per Installation, so that one Installation cannot exhaust the disk that serves the others.
19. As an operator, I want new storage keys namespaced by Installation, so that deleting an Installation is a prefix operation and not a hunt.
20. As an operator, I want the canonical URL to be relative in the database, so that changing a domain is a settings change.
21. As an operator, I want the provider origin to come from storage configuration rather than a constant in the code, so that the same image can point at a different provider without a rebuild.
22. As an operator, I want the delivery route to answer with an explicit cache policy, so that a replaced file is never served from a stale cache.
23. As a developer, I want one upload endpoint that writes through the driver interface, so that adding a driver never adds a transport.
24. As a developer, I want the media service to accept bytes rather than a provider URL, so that it has no knowledge of any provider.
25. As a developer, I want a single function composing a media address, so that no caller invents one.
26. As a developer, I want the image loader to recognise address shapes rather than hostnames, so that it carries no brand and no runtime configuration.
27. As a developer, I want the absolute form composed only at the boundary (social metadata, JSON-LD, sitemap, email), so that "absolute" is a deliberate exception and not the default.
28. As a developer, I want legacy keys to resolve through the same route, so that there is exactly one address contract in the system.
29. As a developer, I want the delivery route to reject path traversal, so that a URL segment can never escape the storage root.
30. As a developer, I want the driver contract test to keep running against both drivers, so that the seam stays proven with a second implementation.
31. As a maintainer, I want the reason for serving through an application route rather than a proxy rule recorded, so that nobody "simplifies" it back into a build-time rewrite.
32. As a maintainer, I want the quota counted from the same manifest the delivery path uses, so that there is no second source of truth for bytes.

## Implementation Decisions

### Vocabulary

The spec uses the vocabulary already in `GLOSSARY.md`: **Media**, **Media type**, **Media rendition**, **Media profile**, **Storage key**, **Storage driver**, **Media revision**, **Storage prefix**, **Archived media**, **Installation**, **Installation settings**. No new entity is introduced. In particular there is no `Asset` module and no `MediaVariant`.

### 1. One canonical address

- The only function composing a media address is `mediaPath(key)`, returning `/media/<key>`. A second, explicit `absoluteMediaUrl(key, siteUrl)` composes the absolute form for the boundaries that require one: social metadata, JSON-LD, sitemap and email HTML.
- `Media.url` stores the relative form `/media/<key>` and nothing else. It does not carry a domain and it does not carry the rendition manifest token. The manifest is derived from `Media.renditions` when needed.
- Existing rows keep their absolute URLs until a later migration; they are read through the loader and the delivery route exactly as before.

### 2. The delivery route

- `GET /media/<key>` resolves the key by looking up the `Media` row that owns it, reading `Media.storageDriver`, and delegating to that driver. `HEAD` answers the same headers with no body.
- Local driver: streams the bytes with the object's content type, an ETag derived from the key and `Cache-Control: public, max-age=31536000, immutable`. `Range` requests are answered, because audio, video and PDF are stored and served untouched and seeking is part of their contract.
- Remote driver: `302` to the object's CDN URL, with the same immutable cache policy on the redirect itself, so the browser caches the hop once.
- Unknown key: `404`. A key containing `..`, a backslash, a null byte or an absolute path is rejected before touching the driver.
- Media rows created before this change carry no `storageDriver`. They are treated as remote, because their bytes are on the remote provider.
- The route is brand-free in its own logic: it asks the row which driver to use.

### 3. Namespaced storage keys

- New keys follow `<installationSlug>/<mediaId>/<revision>/original` and `<installationSlug>/<mediaId>/<revision>/<width>.<format>`.
- The slug comes from an environment variable written by the Control plane; it is not a concept the application models, and there is no `Tenant` table. When the variable is absent, a fixed default segment is used so that every new key has a root segment.
- Existing keys are flat and are never renamed. The driver resolves them unchanged; prefix operations simply do not reach them, which is correct because legacy keys live on the remote provider.

### 4. One upload transport

- The browser posts the file to a single application endpoint as multipart form data. The endpoint validates authentication, media type and size, checks the quota, writes the bytes through the active driver, and only then hands the stored key to the media service.
- The media service takes bytes and a key it has written, never a provider URL. Provider knowledge disappears from it.
- A failure after the bytes are written removes them: an attempt that fails leaves no row and no object.
- Error responses are machine-readable: an oversize file, an exceeded quota and a duplicate checksum are distinct codes, so the admin UI can say the right thing. A duplicate keeps the existing "use the existing one / upload anyway" choice.
- This endpoint serves the media library only. The five other upload purposes in the application (avatars, submission attachments, impression files, email attachments) keep their current provider path and are migrated by a follow-up. Until that follow-up, a fresh Installation using local storage will have a working media library but those other features will still require UploadThing.

### 5. The active driver is recorded per Media

- A Media records which storage driver wrote it. Delivery resolves the driver per row rather than once per Installation.
- Switching the active driver therefore affects only new uploads: everything already stored keeps resolving through the driver that wrote it, and a later migration moves files row by row instead of flipping a switch that darkens half the site.
- Media created before this change carry no driver. They are treated as remote, because that is where their bytes are. That is a rule of the resolver, not a rewrite of rows.

### 6. The active driver is selected in the backoffice

- The choice of driver is a setting of the Installation, edited in the media library, not an environment variable. The UploadThing token stays in the environment, where it is today.
- The resolver reads, in order: the setting, then the environment, then the default. An Installation that never touches the setting behaves exactly as it does today, which is what makes this a safe first step.
- Local disk is not a provider: it needs no credentials, and selecting it is all an Installation has to do to stop depending on one.
- UploadThing is offered only while a token is configured; otherwise the option is visible but disabled, so the admin sees why it is unavailable instead of getting a failed upload.
- Resolution happens per request and is invalidated when the setting is saved, so switching takes effect without a restart.
- The fallback default stays what the code does today, so no deploy silently changes where an Installation writes. A fresh Installation selects local disk once; which driver is the default for a brand-new Installation is a question the Integration spec settles, not this one.
- No caller captures a driver at module load. Which configuration the resolver reads is not the caller's business.
- Turning this setting into an Integration — token in the database, encrypted, descriptor and form — is a separate spec and the environment exception to ADR-0023 survives until then.

### 7. The provider origin comes from storage configuration

- The UploadThing file origin stops being a runtime constant in the loader for newly written Media; it is embedded in the rendition manifest written by the processor. The loader itself remains pure and configuration-free.
- For legacy Media without a manifest, the origin remains a build-time constant so that existing URLs keep resolving without a content migration.
- Moving the legacy `/assets/<key>` rewrite into a runtime route is not part of this spec. It is needed only when the configuration starts living in the database, which is the Integration's job, and the live legacy URLs are the reason it must be done with care rather than alongside everything else.

### 8. The image loader carries no brand

- The loader recognises address shapes, not hostnames: a relative `/assets/` address, a relative `/media/` address, an absolute provider URL, and a relative `/media/` address carrying a rendition manifest.
- It performs no I/O and reads no configuration.
- An absolute address on the site's own domain that is not one of those shapes passes through untouched. It still renders; it simply does not get a rendition swap. No content migration is attempted here.
- The host-agnostic own-host check belongs on the server, where the canonical URL is known, and is used to decide whether an address needs the absolute form.

### 9. Media quota

- `Installation settings` gains a media quota, expressed in megabytes with a default of 5120 (5 GB), editable from the backoffice. Megabytes, not bytes: byte totals exceed the range of a 32-bit column at plausible quotas, and megabyte granularity is the correct product granularity.
- Usage is counted as the original's size plus the bytes recorded in the rendition manifest, over every Media including archived ones. It is computed from the same manifest the delivery path uses; there is no second source of truth and no denormalised counter until measurement proves one is needed.
- The check happens before the upload writes anything, and again before the row is created, so a concurrent upload can be refused rather than silently overshooting.
- The library shows used and total, warns above 80% and refuses at 100% with the actual figures in the message.
- With a remote driver the bytes travel browser to provider, so the check is best-effort by construction. With the local driver it is exact. This is documented, not engineered around.

### 10. Schema changes

- `Media` gains a `storageDriver String?` column. Existing rows are `NULL` and resolve as remote.
- `Settings` gains `mediaQuotaMb Int @default(5120)` and `storageDriver String?`. `storageDriver` on `Settings` is the active choice; `storageDriver` on `Media` is the historical record.
- `Media.key` keeps its flat legacy values for existing rows and receives namespaced values for new rows.
- `Media.url` is migrated in meaning, not in content: existing absolute URLs stay until a later migration writes relative URLs.

### 11. Driver contract

- The `StorageDriver` interface keeps `put`, `get`, `delete`, `deletePrefix` and `url`.
- `url(key)` for the local driver returns the canonical relative path `/media/<key>`. For the remote driver it returns the provider's CDN URL.
- The contract suite runs against both drivers, asserting that `url()` returns the canonical relative address for the local driver and the provider origin for the remote one, and that prefix deletion respects the namespace.

### 12. Rollout

- The existing Installation keeps its current driver and its existing URLs. Nothing in this spec rewrites a stored URL, moves a byte or deletes an UploadThing file.
- A new Installation is provisioned with the local driver and works end to end for its media library without any provider account.
- The existing Installation keeps behaving exactly as it does today until someone selects a driver in the media library; no deploy changes which driver it uses.

### 13. Production deployment for local storage

- A production Installation using the local driver must mount a persistent Docker volume at the local storage root. Without it, a redeploy would lose the stored files.
- The volume must be included in the backup strategy alongside the database. The self-hosting runbook is updated to describe the volume, the backup command and the restore command.
- The local driver is not a development-only feature; it is the default for new Installations and a first-class production option.

## Testing Decisions

A good test asserts observable behaviour at the highest seam that can express it: given a request, the response; given a file, the Media that exists and the bytes that can be read back. No assertions about which helper was called, no mocks of the storage driver in tests that have a real one available on a temporary directory.

**Seam 1 — HTTP upload to delivery.** One test drives the whole chain: post a file, receive a Media whose URL is relative and namespaced, fetch that URL, receive the same bytes with the right content type and cache headers, under both drivers where possible (local on a temporary directory; the remote driver against the existing fake).

**Seam 2 — The delivery route.** Cases: local object streams with content type, ETag and immutable cache; missing key answers 404; traversal segment answers 404 and never reaches the driver; remote provider answers 302 with the immutable cache policy; `Range` on a non-image returns partial content; `HEAD` returns the same headers with no body; a legacy flat key resolves; a Media whose row records the local driver is streamed from disk, one that records the remote driver is redirected, and one with no recorded driver resolves as remote.

**Seam 3 — Storage driver contract and resolution.** The shared contract suite runs against both drivers, asserting that `url()` returns the canonical relative address for the local driver and the provider origin for the remote one, and that prefix deletion respects the namespace. Resolution tests cover: the setting wins over the environment; the environment wins over the default; saving the setting makes the next request use the new driver without a restart; UploadThing is reported unavailable when no token is configured.

**Seam 4 — Media service.** Cases: created keys follow the namespaced layout; the stored URL is relative and contains no domain; a replacement bumps the revision and changes every key; quota exhaustion refuses before writing and leaves nothing behind; an upload that fails after writing removes the object.

**Seam 5 — Address composition and loader.** Cases: `mediaPath`, absolute form, key extraction from `/media/`, `/assets/` and provider URLs, and a legacy key that has no namespace segment. Loader cases: `/media/` with manifest resolves to rendition; `/media/` without manifest resolves to original; `/assets/` resolves to provider; provider URL passes through; non-managed URL passes through.

**Seam 6 — Legacy addresses keep working.** `/assets/<key>` still answers after the provider origin moves from a hard-coded constant to storage configuration, for a key that exists and for one that does not. This is the test that protects the existing live legacy URLs.

## Out of Scope

- Migrating the existing files off UploadThing, and rewriting the URLs embedded in Puck data, rich-text bodies, ad images, the logo setting and email HTML. That is the next spec, and it must run its rewrite sweep before any UploadThing file is deleted.
- Turning storage into an Integration configured from the backoffice: token in the database and encrypted, a provider descriptor and form, and the legacy `/assets/` rewrite served from a runtime route. This spec only adds a setting that selects the driver; the token stays in the environment.
- The five other upload purposes in the application (avatars, submission attachments, impression files, email attachments). They keep their current UploadThing transport. A follow-up will move them to the same driver-agnostic transport. Until then, an Installation that wants to be completely UploadThing-free cannot go to production.
- An S3/R2 driver, a shared bucket across Installations, and any billing or automated suspension built on the quota.
- Video posters and duration extraction: no new binary in the container.
- Image editing, cropping, automatic alt text.
- Garbage collection of archived media, and any quota grandfathering rule.

## Further Notes

- **Production readiness.** This spec makes the media library independent from UploadThing. The CMS as a whole is not UploadThing-free until avatars, submission attachments, impression files and email attachments are moved to the same driver-agnostic transport. That limitation must be communicated in the spec and in the self-hosting docs.
- **Measured order of magnitude for the existing Installation:** a few hundred images, small average size, well under 1 GB of originals, a few GB counting renditions. A 5 GB quota is therefore generous for the current library, which is the right default for a sold product.
- **The existing `/assets/<key>` rewrite** is why the brand constant survives in the build configuration for legacy URLs. This spec derives the provider origin from storage configuration for new Media through the manifest, but keeps the rewrite at build time for legacy URLs; moving it into a runtime route is only needed once the configuration lives in the database.
- **ADR-0026** already records that the storage key is the truth and the URL a projection, so no new ADR is proposed. The one thing worth adding to it is why the delivery hop is an application route, and why the driver is recorded per Media rather than per Installation.
- **This spec narrows the environment-variable exception** to ADR-0023 rather than ending it: the *choice* of driver leaves the environment, the *token* stays until the Integration exists.
- **The self-hosting docs** currently state that UploadThing stays external and that local storage would be a separate project. Once this ships they need a paragraph each: the `/media/` address, the local driver, the persistent volume, and the volume backup that must run alongside the database backup.
