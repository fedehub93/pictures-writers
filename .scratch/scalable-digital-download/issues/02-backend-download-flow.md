# 02: Backend download flow

**What to build:** Calling a single server action with a product root id and an email registers the download and delivers the file.

**Blocked by:** 01 — Database and admin plumbing.

**Status:** done

- [x] Create `subscribeFreeDigitalProduct` server action: validate reCAPTCHA, load the live product and linked form, validate email and privacy consent.
- [x] Create or update the `Contact` with the `interactionType` declared by the linked form.
- [x] Create a `FormSubmission` for the linked form.
- [x] Emit the `form.submitted` trigger event with the linked `formId`.
- [x] Send the delivery email using the global `freeDigitalDownloadTemplateId` template with product variables (title, download URL, cover image, etc.).
- [x] Create a generic `DIGITAL_DOWNLOAD` admin notification.
- [x] Add tests for the action covering success, missing form, missing template, and duplicate contact interaction.

## Notes

- `subscribeFreeDigitalProduct(values, recaptchaToken)` takes `{ rootId, email, privacyConsent }`. It reuses the existing `subscribe_product` reCAPTCHA action.
- `buildFreeDigitalDownloadEmail` renders the global template and returns `null` when the template/provider/live product/format is missing. The action resolves it before writing anything, so a missing template never creates a submission the visitor cannot fulfil.
- The email is sent before the contact/submission writes: a provider failure therefore leaves no download record and starts no nurture sequence. Notification/provider-sync failures are caught so they cannot fail a download the visitor already received.
- Validation uses `safeParse` so email/privacy-consent messages reach the UI instead of collapsing into the generic catch.
- Template variables: `email`, `id` (version id), `rootId`, `slug`, `title`, `description`, `format` (PDF preferred, else first configured), `imageCoverUrl`, `downloadUrl` (absolute `/api/products/download` URL).
- The linked form's nullable `interactionType` is passed to `createContactByEmail`, whose `[contactId, interactionType]` upsert makes repeated downloads safe.
- Form submissions store `{ email, rootId, privacyConsent: true }`; the `form.submitted` payload carries `{ email, rootId }`.
- Verified with `npx tsc --noEmit`, the new test file (6 tests), and the full Vitest suite (152 files, 1287 tests). ESLint on touched files is clean; the repo-wide lint still reports pre-existing errors in unrelated files.

