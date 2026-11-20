# 04: Choose the storage driver from the media library

**What to build:** The owner picks where new media is stored from the media library instead of an environment variable. Choosing local disk makes the Installation stop depending on a provider and start writing to `/media/<key>`; leaving the choice alone behaves exactly as today. UploadThing stays available while its token is configured. Switching takes effect on the next upload with no restart and no redeploy, and every Media already stored keeps being served by the driver recorded on its own row — so the switch never darkens a picture that was working a second earlier.

**Blocked by:** 01, 02

**Status:** done

- [x] The media library offers a storage choice between local disk and UploadThing, stored as a setting of the Installation.
- [x] Saving the choice takes effect on the next upload with no restart and no redeploy.
- [x] An Installation that never touches the choice keeps using the driver it uses today.
- [x] Local disk is always selectable; UploadThing is shown disabled with the reason when no token is configured, so the admin does not discover the problem through a failed upload.
- [x] Selecting local disk makes a new upload land on disk and be served from `/media/<key>`.
- [x] Selecting UploadThing keeps sending new uploads to UploadThing, and the library renders them, whichever address shape they carry.
- [x] Media stored before the switch keep being served by the driver recorded on their row.
- [x] The setting is validated server-side: an unknown value is rejected rather than silently falling through to a default.

## Comments

**2026-11-18** — Closed by `a0d4c4e5`. `Settings.storageDriver String?` holds the active choice (additive migration, no backfill); the media library's toolbar renders a selector next to the quota meter and saves through the existing `PATCH /api/settings`. Resolution lives in `storage/active.ts` and reads the saved setting, then `MEDIA_STORAGE_DRIVER`, then today's `uploadthing` default on every call — nothing is captured at module load, and there is no cache to invalidate, so a save is visible to the next upload without a restart or a redeploy. The multipart and legacy JSON upload paths and the media service's default all resolve through it, and each new row records the driver that wrote it; delivery still resolves per row, so switching leaves every existing Media on its own driver. UploadThing availability is the presence of `UPLOADTHING_TOKEN`: the option is visible but disabled with the reason in the library, and the API also refuses to save it, alongside rejecting any value that is not `local` or `uploadthing`. The replace route now passes the name of the environment-resolved driver it actually wrote with, rather than letting the service record the active setting, so a replaced row never claims a driver that does not hold its bytes. `parseStorageDriver` is the one client-safe parser used by the UI and the API; the docs (§3.11), the glossary entry and ADR-0026 gained the setting, with the token still in the environment.

Tests: PATCH rejects `s3`/`null` and UploadThing without a token and persists both valid choices; the resolver covers setting-over-env, env-over-default, and picking up a save on the next call; an HTTP chain saves through the API then uploads to disk and serves the bytes from `/media/<key>` with an immutable cache, a second chain uploads through a fake UploadThing and answers `302` to its CDN, and a third switches to UploadThing afterwards while the earlier local Media still streams. The driver-selector's disabled state is covered at the `getStorageDriverChoice` seam; no component render test was added.

Known boundaries, unchanged by this ticket: permanent deletion still resolves the environment driver rather than the row's, and replacements and the other upload purposes (avatars, submissions, impressions, email attachments) still use the UploadThing transport until the follow-up that moves them to the driver-agnostic transport.

Verification: `npm run typecheck` clean, `npm run lint` 0 errors (265 pre-existing warnings), `npm run check:doc-citations` 0 broken, `npm run test:run` 280 test files / 2480 tests passed. The production build compiled, typechecked and prerendered against the development database with the prerender pool capped at 4 workers (`experimental.cpus`, reverted afterwards); the additive migration was applied to the development database with `npx prisma migrate deploy`.
