# 08 — UploadThing as a selectable Integration

Status: ready-for-agent
Blocked by: 02

## Problem

Storage is chosen by environment variable and resolved once per process; the CDN origin is a constant in the code; legacy `/assets/<id>` URLs only work because of a build-time rewrite. None of that can be decided from the backoffice, which is what a customer installing the product expects: paste a token, upload, done.

## What

- Add an `uploadthing` Integration provider: `secrets` = the API token; `config` = nothing the customer must type beyond what the token already carries; `affectsPublicSite: true`.
- Resolve the active storage driver at request time from the active storage Integration, instead of `getStorageDriver()`'s module-level `defaultDriver` memo (`src/modules/media/server/storage/driver.ts:55`). Invalidate the memo when the Integration is saved, so a new token takes effect without a restart.
- `storageConfigFromEnv` stays as the fallback for the first Installation, and as the default before anything is configured.
- The upload route (`/api/uploadthing/**`) reads the resolved token instead of `process.env.UPLOADTHING_TOKEN`.
- Legacy `/assets/<id>`: serve it from a runtime route rather than the `next.config.mjs` rewrite, which cannot read the database. Otherwise ticket 05 can only remove `UPLOADTHING_FILE_ORIGIN` by breaking those URLs.
- Document that the token belongs to one UploadThing app, so each customer brings their own; the product does not share one account across Installations.

## Done when

- Pasting a token in the backoffice enables UploadThing on an Installation whose driver was `local`, and the next upload goes to that app.
- No restart or redeploy is needed after saving the Integration.
- Legacy `/assets/<id>` still resolves, with no constant in the code.
- The first Installation keeps working with its existing token and driver.

## Production impact

None until enabled. The first Installation stays on `MEDIA_STORAGE_DRIVER=uploadthing` with its current token, exactly as the runbook says.
