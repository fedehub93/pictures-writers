# 09: No user path touches a storage provider

**What to build:** The browser stops shipping a storage provider's client. The provider's file router and the three endpoints that no longer have a caller disappear, and the legacy upload branch a provider used to feed goes with them. After this, an Installation with no token has no provider code in any path a visitor, an admin or a form submitter can reach.

**Blocked by:** 05, 06, 07

**Status:** done

- [x] The provider's client library is no longer imported by any client component.
- [x] The provider's file router and its public route are gone.
- [x] The three endpoints without a caller and the legacy JSON upload branch are gone.
- [x] Every upload the product offers still works on an Installation with no token.
- [x] The client bundle carries no provider code, and the provider token is read only on the server.
- [ ] A remaining reference to a provider host in stored content is reported by the sweep rather than silently tolerated.

## Comments

**2026-11-20**

Landed in `606e867d` (`feat(media): remove provider code from every user path`).

- `src/app/api/uploadthing/` (the file router and its `GET`/`POST` route), `src/lib/uploadthing.ts` and
  `src/shared/components/file-upload.tsx` are deleted. `@uploadthing/react` is gone from
  `package.json` and the lockfile; the `uploadthing` package stays only because the server-side
  `StorageDriver` uses `UTApi`.
- The last two client consumers were the legacy create/edit user modals, which still uploaded a
  profile image through the `userImage` endpoint. They are gone, together with the dead legacy
  users table under `src/app/(admin)/admin/(routes)/users/_components/` whose only action was to
  open those modals, and with their `createUser`/`editUser` entries in the modal store. The
  current user editor (`src/modules/users/ui/admin`) already uploads through
  `POST /api/files/avatars`.
- `POST /api/media` accepts only multipart: a non-multipart body answers `415`
  `UNSUPPORTED_CONTENT_TYPE`, and the JSON branch, `MediaUploadPayload`, `createPlainMedia` and
  the `storeUploadedObject` flag are removed. `MediaUploadSource` is now just the temporary key
  and the admin's name, type, alt text and MIME; `url` and `size` had no reader left.
- The fallback driver is now `local` (set → environment → local), as the spec's *Derived default*
  requires: a fresh Installation with no token and no saved choice uploads to disk, and a test
  covers that exact state. An Installation already on a provider records `uploadthing`
  explicitly before adopting this code; the runbook and ticket 13 own that step.
- A guard test, `src/modules/media/__tests__/no-provider-in-user-paths.test.ts`, scans `src/` and
  fails if a client module (`"use client"` or `client-only`) imports the provider, if the file
  router path or import returns, if `UPLOADTHING_TOKEN` is read outside a `server-only` module, or
  if the provider's client package returns to `package.json`.
- `docs/media.md`, ADR-0026, `AGENTS.md` and the self-hosting analysis/deploy/runbook/environment
  pages record the removal, the multipart-only upload and the local fallback.

The sweep criterion is not ticked: ticket 11 owns the address sweep and no sweep command exists
yet. This change deliberately keeps the provider host grammar (`isUploadThingUrl`,
`getUploadThingOrigin`, `.ufs.sh`/`utfs.io`) so the sweep can recognise, report and rewrite such
an address instead of tolerating it silently; the ADR records that constraint. Every other
upload product path was exercised without a token: library upload and replace, email
attachments and avatars, public form attachments and inbound email copies.

Verification: `npm run test:run` — 287 files, 2611 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (247 pre-existing warnings); `npm run check:doc-citations` 97 docs /
0 broken; `npm run build:agent` succeeded and its route table has no `/api/uploadthing`. The
built client chunks contain no provider SDK import — the only `uploadthing` string is the driver
selector's own label. No browser probe was run for this ticket.
