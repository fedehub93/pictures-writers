# 02 — Stable media URLs and a working local driver

Status: ready-for-agent
Blocked by: —

## Problem

`Media.url` is a `@unique` column holding an absolute URL. The `local` driver writes files under `MEDIA_STORAGE_LOCAL_ROOT` and composes `MEDIA_STORAGE_LOCAL_PUBLIC_URL` (`/media`), but nothing serves that path, so the driver is dead code. Switching driver or domain would otherwise require rewriting every row — the WordPress migration problem.

## What

- `mediaUrl(key)` is the only function that composes a media URL: `<siteUrl>/media/<key>`.
- `Media.key` is the source of truth; `Media.url` is derived from it.
- Add `src/app/media/[...path]/route.ts`: streams from disk for `local`, `302` + `Cache-Control: public, max-age=31536000, immutable` to the provider for remote drivers.
- `storageKeyFromMediaUrl` in `src/modules/media/lib/url.ts` recognises `/media/<key>` in addition to the legacy `/assets/` and `ufs.sh` shapes.
- `isPicturesWritersUrl` becomes a host-agnostic `isOwnMediaHost`, driven by `Settings.siteUrl` and the configured storage origins.
- Storage keys are namespaced per Installation (`<installationSlug>/<mediaId>/<revision>/…`). The slug arrives as an env var written by the Control plane, not as a Tenant concept in the code.
- Quota: `Settings.mediaQuotaBytes` (default 5 GB), checked before an upload, counted as original plus renditions.

## Done when

- A fresh Installation using the `local` driver uploads an image, and it renders in a post, in OG metadata and in an email.
- No stored URL contains a domain.
- Every existing `ufs.sh` and `/assets/` URL still resolves.

## UploadThing

This ticket makes the URL stable and adds the pass-through; it does **not** move the token. The token, the driver selection and the legacy `/assets/<id>` route are ticket 08. The one thing not to defer here: the stable URL only works for UploadThing if `/media/<key>` can `302` to the app's origin, and the origin is currently a constant (`UPLOADTHING_FILE_ORIGIN`). Resolve it from the storage configuration now, even while that configuration still comes from the environment.

## Production impact

Additive. The first Installation keeps `MEDIA_STORAGE_DRIVER=uploadthing` and its existing URLs keep working untouched. Only new rows use the `/media` shape.
