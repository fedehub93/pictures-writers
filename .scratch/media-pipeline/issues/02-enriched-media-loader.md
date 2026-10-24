# 02: Enriched Media, metadata backfill, custom image loader

**What to build:** Media becomes the identity of a file rather than a URL: it gains MIME type, checksum, revision, per-type metadata (intrinsic dimensions, blur placeholder) and the rendition manifest, with archive state. The 674 existing images get their metadata backfilled once, and delivery switches to a custom `next/image` loader that resolves a storage key to a rendition or falls back to the original. From this ticket on, no page visit makes the VPS transform an image.

**Blocked by:** 01

**Status:** done

- [x] After the backfill, every reachable image Media carries MIME type, byte size, intrinsic dimensions, checksum and blur placeholder; re-running the backfill changes nothing.
- [x] The public site renders through the custom loader and the Next image optimizer route is no longer used for media.
- [x] Requesting a rendition that does not exist yields the original URL, never a broken image and never a server round-trip.
- [x] External URLs, SVGs and data URIs pass through the loader unchanged.
- [x] The configured image width ladder matches the generated rendition widths, so the loader never asks for a width that cannot exist.
- [x] The media library exposes the new metadata; blur placeholders are applied only to cover and hero-sized images.
- [x] The broken `90w` sizes unit is fixed and every `quality={100}` is aligned to the ladder.
- [x] The self-hosting documentation no longer claims image optimisation is disabled, and describes the new delivery behaviour.

## Notes

- `Media` gains `mimeType`, `checksum`, `revision`, `metadata`, `renditions` and `archivedAt` (migration `20261024100000_enrich_media`).
- The width ladder lives in `src/modules/media/lib/image-ladder.mjs`, shared by `next.config.mjs` and the processor; `next/image` now uses `loaderFile: ./src/modules/media/lib/image-loader.ts` and no longer has `remotePatterns`, `formats` or `minimumCacheTTL`.
- The loader is a pure function. A delivery URL may carry the rendition manifest in its `mt` query token (`buildMediaDeliveryUrl`); without a token it resolves to the original, so every legacy `/assets/*` and UploadThing URL keeps working while renditions are backfilled by a later ticket.
- Integration point for 03/06: the processor writes `Media.url` with `buildMediaDeliveryUrl(originalUrl, { revision, archived, renditions })` when it has resolved rendition URLs. Until that writer lands, every row legitimately falls back to its original. URLs embedded in Puck/TipTap/email JSON have no token and always fall back to the original, as the parent spec keeps those JSON payloads out of scope.
- `Media.renditions` stores keys only (no provider URL); the URL lives in the derived delivery token, which is why the delivery path stays provider-agnostic.
- Metadata is filled by `npm run media:backfill-metadata` (`src/modules/media/server/backfill-media-metadata.ts`), idempotent, bounded concurrency, reachable-source failures reported and skipped. Legacy UploadThing objects are read through their provider file key because they predate the customId addressing of the storage seam.
- Blur placeholders now come from `Media.metadata.blurDataURL` and are only applied to post cards, the post hero and the webinar hero. `src/lib/image.ts` (runtime sharp) was removed.
- Docs updated: `docs/self-hosting/01-analisi-e-piano.md`, `06-cutover-dns.md`, `07-test-e-verifica.md`, `08-operations-runbook.md` and `AGENTS.md`.
