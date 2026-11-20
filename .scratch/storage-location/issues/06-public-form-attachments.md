# 06: Public form attachments

**What to build:** A visitor can attach a file to a public form on an Installation with no provider account, and the file arrives served from the Installation's own domain. Because the uploader is anonymous, the transport is rate-limited per client and per form, capped in size, and labels the file as public-origin so the budget can protect the owner.

**Blocked by:** 05

**Status:** done

- [x] A visitor submits a form with a PDF and receives a served attachment that opens from the Installation's domain.
- [x] The transport refuses a file over the per-file cap and refuses a burst beyond the rate limit, each with a machine-readable answer.
- [x] Every file created this way is labelled public-origin.
- [x] A refused upload leaves no bytes and no record.
- [x] The submission's data points at the attachment and never at a provider address.
- [x] The designer preview of the upload field still renders without performing an upload.

## Comments

**2026-11-20**

Landed in `c83a4921` (`feat(forms): upload public form attachments through the application`).

- The visitor's transport is `POST /api/forms/<formId>/attachments`. It is anonymous, so it
  checks in this order: a per-client window (10/minute), the multipart file and its 4 MB cap
  (announced `content-length` first, then the part), the form's existence, and a per-form window
  (30/minute). Both windows share the fixed-window limiter `src/shared/lib/fixed-window-rate-limit.ts`,
  extracted from the integrations connection test so the two cannot drift. The form budget is
  spent only by a real file for a real form, so an empty POST cannot deny uploads to its visitors;
  a flood of invented keys evicts the oldest window instead of clearing every window.
- Every file the transport writes is `kind = ATTACHMENT`, `origin = PUBLIC`, through the active
  driver. The answer is the stored-file id plus the canonical `/files/<key>` address; a refusal
  answers `NO_FILE`, `FILE_TOO_LARGE` (with `maxBytes`), `RATE_LIMITED` (with `retryAfterSeconds`
  and `Retry-After`) or `FORM_NOT_FOUND`, and leaves no bytes and no record.
- Upload fields use `PublicFileUpload` instead of the provider's browser button, in the builder
  runner and in the legacy dynamic form. `FormRunner` now takes `formId` (the unused `id` is
  gone) and puts it in context for the field. The designer renders the control disabled without a
  form id, so the canvas never uploads. `FileUploadButton` lost its last caller and was deleted.
- `createFormSubmission` claims the uploaded records in the same transaction that writes the
  answer. It accepts only unclaimed `ATTACHMENT` files of public origin, and rewrites every
  descriptor in `data` from the claimed record — address, name, size and content type — so a
  crafted `url` or legacy provider `key` from the browser is discarded. Tests post a provider URL
  and assert the stored answer is the canonical one. Both submission server actions and the
  product JSON route use this helper.
- Deleting a submission reads its attachments before the cascade and removes each object through
  the driver recorded on the file, reporting a driver it cannot reach rather than losing the
  record. The role, via `Restrict`, refuses a delete while the submission still points at it.
- The multipart reading and refusal shape moved to `src/shared/lib/multipart-upload.ts`, shared
  with the admin attachment and avatar transports. `docs/media.md` and ADR-0026 record the
  anonymous transport and the recomposed answer.

Tests: a new end-to-end suite covers upload → submission → `/files` delivery with the correct
bytes and cache headers, `origin = public` and local-driver record; an oversize refusal with no
record and no files; a client burst; a form burst across many clients; empty POSTs not spending
the form budget; refusal of an internal-origin attachment; and submission deletion removing the
object and record. A render test proves the designer control is disabled and never calls `fetch`.

Uploads that are never claimed (a cancelled dialog, a validation failure after the upload) are
not garbage-collected; that was true of the provider path too and ticket 08 counts those bytes
against the budget.

Verification: `npm run test:run` — 286 files, 2596 tests passed; `npm run typecheck` clean;
`npm run lint` 0 errors (250 pre-existing warnings); `npm run check:doc-citations` 97 docs /
0 broken; `npm run build:agent` succeeded and registered `/api/forms/[formId]/attachments`. No
browser probe was run for this ticket.
