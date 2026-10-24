# 02: Enriched Media, metadata backfill, custom image loader

**What to build:** Media becomes the identity of a file rather than a URL: it gains MIME type, checksum, revision, per-type metadata (intrinsic dimensions, blur placeholder) and the rendition manifest, with archive state. The 674 existing images get their metadata backfilled once, and delivery switches to a custom `next/image` loader that resolves a storage key to a rendition or falls back to the original. From this ticket on, no page visit makes the VPS transform an image.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] After the backfill, every reachable image Media carries MIME type, byte size, intrinsic dimensions, checksum and blur placeholder; re-running the backfill changes nothing.
- [ ] The public site renders through the custom loader and the Next image optimizer route is no longer used for media.
- [ ] Requesting a rendition that does not exist yields the original URL, never a broken image and never a server round-trip.
- [ ] External URLs, SVGs and data URIs pass through the loader unchanged.
- [ ] The configured image width ladder matches the generated rendition widths, so the loader never asks for a width that cannot exist.
- [ ] The media library exposes the new metadata; blur placeholders are applied only to cover and hero-sized images.
- [ ] The broken `90w` sizes unit is fixed and every `quality={100}` is aligned to the ladder.
- [ ] The self-hosting documentation no longer claims image optimisation is disabled, and describes the new delivery behaviour.
