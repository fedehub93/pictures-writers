# 05: Permanent deletion resolves the driver per Media

**What to build:** Deleting a selection that mixes Media written by different drivers removes each object through the driver that owns it, both the revision prefix and the legacy original. A mixed library leaves no bytes behind on either the local volume or the provider.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] A selection containing a legacy Media with no recorded driver and a local Media deletes each through its own driver.
- [x] No local bytes remain under a deleted revision prefix, and the legacy object is deleted when its provider is configured.
- [x] When the legacy provider is not configured, the deletion of the rows still succeeds and the skipped object is reported rather than silently ignored.
- [x] A Media written by an unknown driver does not abort the whole batch.
- [x] Tests cover the mixed batch, both cleanups, and the unconfigured-provider case.

## Comments

**2026-11-19 — landed in `3bdff870`, review fixes in `5c500a5c`.**

Permanent deletion now resolves the driver recorded on each row instead of using the active driver for the whole batch. A row with no recorded driver resolves as legacy UploadThing; a name this build does not know, or a driver whose credentials are absent here, is reported as `skipped` and never aborts the batch. A namespaced Media is removed by its whole installation directory, so a stale revision left by an interrupted replace goes with it, while a legacy row is removed by its exact provider file key because a customId prefix scan cannot address a pre-seam object.

The router returns `{ deleted, cleanup }`, where each cleanup entry carries the status and, for a skip, the resolver's reason. The admin toast says how many stored objects were left behind and why, rather than presenting the deletion as fully successful. Rows are deleted as each one's objects are removed, so a provider failure reports how many Media were already deleted instead of leaving rows whose bytes are gone. The driver is resolved once per batch and shared across rows that record it, and legacy rows no longer trigger a full provider listing.

The resolver is shared with replace cleanup, which now also reports an unknown recorded driver as `skipped` rather than guessing. `GLOSSARY.md` and ADR-0026 were updated so the deletion contract matches the code, and the stale `removeMany` debt line was removed from `docs/media.md`.

Tests: `media-archive.test.ts` covers a mixed batch with a local Media plus both legacy key shapes, a stale revision under the deleted prefix, the unconfigured provider (rows deleted, object left, reason reported), the unknown driver, and a mid-batch storage failure that keeps the untouched row and its bytes. `media-service.test.ts` covers replace cleanup for an unknown recorded driver. `media-router.test.ts` asserts the new result shape, and `deletion-notice.test.ts` covers the admin notice.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (257 pre-existing warnings), `npm run check:doc-citations` 96 docs / 0 broken, `npm run test:run` 281 files / 2539 tests passed, `npm run build:agent` succeeded. No browser probe was run: the change is server-side apart from the deletion toasts.
