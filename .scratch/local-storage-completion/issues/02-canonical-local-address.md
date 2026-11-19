# 02: Canonical local media address

**What to build:** The local driver always composes the canonical relative `/media/<key>` address. The public-prefix environment variable is removed, so an Installation cannot configure a prefix that the delivery route cannot serve. A leftover value in an environment file has no effect.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] No configuration, documentation or environment sample exposes a configurable local public prefix.
- [x] The local driver composes `/media/<key>` for originals and renditions, and the delivery route serves those addresses.
- [x] A leftover public-prefix value has no effect on any address.
- [x] Tests assert the address shape and the absence of the variable.
- [x] The environment appendix is updated.

## Comments

**2026-11-19 — landed in `e3d00122`.**

`MEDIA_STORAGE_LOCAL_PUBLIC_URL` and the driver's `publicBaseUrl` option are gone. The local driver now returns `mediaPath(key)` from `src/modules/media/lib/url.ts`, so local originals and renditions carry the same `/media/<key>` address `Media.url` stores and `GET /media/<key>` serves. A leftover variable has no effect: `driverForStorageDriver("local", …)` ignores it and still composes `/media/media-1/1/original`.

Verification: `npm run typecheck`, `npm run lint` (0 errors, pre-existing warnings only), `npm test` (279 files, 2490 tests passed), `npm run check:doc-citations` (96 docs, 0 broken citations).
