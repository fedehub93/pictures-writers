# 03: Media quota with visibility in the library

**What to build:** Each Installation has a media quota in its settings, counted over originals plus generated renditions, archived Media included. The library shows how much is used against the quota, warns as it approaches the limit, and an upload that would exceed it is refused with the real figures in the message and leaves nothing behind — no row, no object, no consumed quota.

**Blocked by:** 01

**Status:** done

- [x] Installation settings carry a media quota in megabytes, defaulting to 5120 (5 GB), editable from the backoffice.
- [x] Usage counts the original's size plus the bytes recorded in each rendition manifest, over every Media including archived ones.
- [x] The library shows used and total, and warns above 80%.
- [x] An upload that would take usage past the quota is refused with the used and total figures in the message, and no bytes or rows are written.
- [x] The refusal is distinguishable from an oversize file and from a duplicate checksum, so the admin UI can say the right thing.
- [x] The check runs before the bytes are written and again before the row is created.
- [x] Quota arithmetic is covered by a unit test over shapes (empty library, originals only, renditions counted, archived included, exactly at the limit, one byte over).
- [x] An upload refused for quota can be retried successfully after the admin deletes or archives enough media.

## Comments

**2026-11-18** — Closed by `2c5d395e`. `Settings.mediaQuotaMb` is an `Int @default(5120)` with its migration; the general settings page edits it and `PATCH /api/settings` validates it through the same `parseMediaQuotaMb` the form uses. Usage is `Media.size` plus every rendition's recorded `bytes`, over the whole table with no `archivedAt` filter, computed by a pure `mediaUsageBytes` and read from the same manifest the delivery path serves. The library renders a meter with used/total and a warning above 80%. The multipart endpoint checks the file size against `MEDIA_QUOTA_EXCEEDED`, and the media service re-checks the exact original-plus-ladder total inside an advisory-locked transaction before creating the row, deleting the written prefix on refusal. Oversize, quota and duplicate answers carry `FILE_TOO_LARGE`, `MEDIA_QUOTA_EXCEEDED` and `DUPLICATE_MEDIA`; the replace route now maps a quota refusal to 413 with the figures and removes its uploaded input, and the create modal clears a file that is too large while keeping a quota-refused one for a retry.

Archiving does not free quota: the spec counts archived Media, so only permanent deletion makes a refused upload succeed. The retry test archives then permanently deletes the space hog before re-uploading, and the ticket's "or archives" wording cannot satisfy it by construction.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (265 pre-existing warnings), `npm run test:run` 275 test files / 2458 tests passed. The production build compiled, typechecked and prerendered all 382 pages with the local prerender pool kept to 4 workers; the default 19 workers exhaust the local development database's connection limit, which `src/shared/lib/db.ts` already documents.
